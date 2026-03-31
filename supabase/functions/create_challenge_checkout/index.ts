import { createClient } from 'npm:@supabase/supabase-js@2';
import Stripe from 'npm:stripe@16.10.0';

type CreateCheckoutPayload = {
  challenge_id?: string;
  creator_id?: string;
  amount_each_side?: number;
  currency?: string;
  payout_destination?: 'winner' | 'developers';
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
  const stripePriceCurrency = (Deno.env.get('STRIPE_CURRENCY') ?? 'brl').toLowerCase();
  const appUrl = Deno.env.get('EXPO_PUBLIC_APP_URL') ?? Deno.env.get('SITE_URL') ?? 'https://example.com';

  if (!supabaseUrl || !anonKey || !serviceRole || !stripeSecretKey) {
    return json(
      {
        error:
          'Faltam variáveis obrigatórias: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY ou STRIPE_SECRET_KEY.',
      },
      500,
    );
  }

  const token = req.headers.get('Authorization')?.replace('Bearer ', '').trim();
  if (!token) return json({ error: 'Token ausente.' }, 401);

  const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const adminClient = createClient(supabaseUrl, serviceRole);
  const stripe = new Stripe(stripeSecretKey);

  const { data: authData, error: authError } = await userClient.auth.getUser();
  if (authError || !authData.user) return json({ error: 'Sessão inválida.' }, 401);
  const userId = authData.user.id;

  const body = (await req.json()) as CreateCheckoutPayload;
  const challengeId = String(body.challenge_id ?? '').trim();
  const payloadAmount = Number(body.amount_each_side ?? 0);
  const payloadPayout = body.payout_destination === 'developers' ? 'developers' : 'winner';
  if (!challengeId) return json({ error: 'challenge_id é obrigatório.' }, 400);

  const { data: challenge, error: challengeError } = await adminClient
    .from('challenges')
    .select('id, creator_id, title, bet_amount, currency, escrow_status, failure_destination_details')
    .eq('id', challengeId)
    .maybeSingle();

  if (challengeError || !challenge) return json({ error: 'Desafio não encontrado.' }, 404);
  if (challenge.creator_id !== userId) return json({ error: 'Apenas o criador pode iniciar checkout.' }, 403);

  const amountFromDb = Number(challenge.bet_amount ?? 0);
  const amount = Number.isFinite(payloadAmount) && payloadAmount > 0 ? payloadAmount : amountFromDb;
  if (!(amount > 0)) return json({ error: 'Valor do duelo inválido para checkout.' }, 400);

  const currency = String(challenge.currency ?? stripePriceCurrency).toLowerCase();
  const amountCents = Math.round(amount * 100);

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    success_url: `${appUrl.replace(/\/+$/, '')}/challenge/${challengeId}?payment=success`,
    cancel_url: `${appUrl.replace(/\/+$/, '')}/challenge/${challengeId}?payment=cancelled`,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency,
          unit_amount: amountCents,
          product_data: {
            name: `Aposta: ${challenge.title ?? 'Desafio'}`,
            description: 'Entrada no duelo (escrow).',
          },
        },
      },
    ],
    metadata: {
      challenge_id: challengeId,
      creator_id: userId,
      payout_destination: payloadPayout,
      amount_each_side: String(amount),
    },
  });

  const existingMeta =
    (challenge.failure_destination_details as Record<string, unknown> | null | undefined) && typeof challenge.failure_destination_details === 'object'
      ? (challenge.failure_destination_details as Record<string, unknown>)
      : {};

  const mergedMeta: Record<string, unknown> = {
    ...existingMeta,
    payment: {
      ...(existingMeta.payment as Record<string, unknown> | undefined),
      mode: 'stripe',
      provider: 'stripe',
      currency: currency.toUpperCase(),
      each_side_amount: amount,
      platform_fee_percent: 10,
      checkout_session_id: session.id,
      checkout_status: session.status,
    },
  };

  await adminClient
    .from('challenges')
    .update({
      escrow_payment_intent_id: session.id,
      escrow_status: 'pending',
      failure_destination_details: mergedMeta,
    })
    .eq('id', challengeId);

  await adminClient.from('wallet_transactions').insert({
    user_id: userId,
    challenge_id: challengeId,
    type: 'challenge_stake_checkout_created',
    amount,
    currency: currency.toUpperCase(),
    payment_provider: 'stripe',
    provider_transaction_id: session.id,
    status: 'processing',
    metadata: {
      checkout_session_id: session.id,
      payout_destination: payloadPayout,
    },
  });

  return json({
    checkout_url: session.url,
    session_id: session.id,
  });
});
