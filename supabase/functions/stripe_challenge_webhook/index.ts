import { createClient } from 'npm:@supabase/supabase-js@2';
import Stripe from 'npm:stripe@16.10.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
  const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

  if (!supabaseUrl || !serviceRole || !stripeSecretKey || !stripeWebhookSecret) {
    return json({ error: 'Configuração incompleta para webhook Stripe.' }, 500);
  }

  const signature = req.headers.get('stripe-signature');
  if (!signature) return json({ error: 'Assinatura Stripe ausente.' }, 400);

  const rawBody = await req.text();
  const stripe = new Stripe(stripeSecretKey);
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, signature, stripeWebhookSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Webhook inválido.';
    return json({ error: msg }, 400);
  }

  const adminClient = createClient(supabaseUrl, serviceRole);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const challengeId = session.metadata?.challenge_id;
    const creatorId = session.metadata?.creator_id;
    const payoutDestination = session.metadata?.payout_destination ?? 'winner';
    const amount = (session.amount_total ?? 0) / 100;
    const currency = (session.currency ?? 'brl').toUpperCase();

    if (!challengeId) return json({ ok: true, skipped: 'no challenge_id metadata' });

    await adminClient
      .from('challenges')
      .update({
        escrow_status: 'locked',
        escrow_payment_intent_id: String(session.payment_intent ?? session.id),
      })
      .eq('id', challengeId);

    await adminClient.from('wallet_transactions').insert({
      user_id: creatorId ?? null,
      challenge_id: challengeId,
      type: 'challenge_stake_locked',
      amount,
      currency,
      payment_provider: 'stripe',
      provider_transaction_id: session.id,
      status: 'completed',
      metadata: {
        event_id: event.id,
        payment_intent: session.payment_intent,
        payout_destination: payoutDestination,
      },
    });
  } else if (event.type === 'checkout.session.expired' || event.type === 'checkout.session.async_payment_failed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const challengeId = session.metadata?.challenge_id;
    const creatorId = session.metadata?.creator_id;
    const amount = (session.amount_total ?? 0) / 100;
    const currency = (session.currency ?? 'brl').toUpperCase();
    if (challengeId) {
      await adminClient.from('wallet_transactions').insert({
        user_id: creatorId ?? null,
        challenge_id: challengeId,
        type: 'challenge_stake_failed',
        amount,
        currency,
        payment_provider: 'stripe',
        provider_transaction_id: session.id,
        status: 'failed',
        metadata: {
          event_id: event.id,
          reason: event.type,
        },
      });
    }
  }

  return json({ received: true });
});
