/**
 * Mensagens em português para erros do Supabase Auth no signup.
 * O painel pode devolver 400 por redirect URL, senha, e-mail duplicado, hook, etc.
 */
export function formatAuthSignUpError(error: unknown, minPasswordLen: number): string {
  const e = error as { message?: string; status?: number; code?: string };
  const raw = (e.message ?? (typeof error === 'string' ? error : '') ?? '').trim();
  const m = raw.toLowerCase();
  const c = String(e.code ?? '').toLowerCase();
  const status = e.status;

  if (
    status === 429 ||
    c.includes('429') ||
    m.includes('429') ||
    m.includes('too many requests') ||
    m.includes('over_email_send_rate_limit') ||
    m.includes('rate limit')
  ) {
    return 'Muitas tentativas. Aguarde alguns minutos e tente de novo.';
  }

  if (
    m.includes('already') ||
    m.includes('registered') ||
    m.includes('exists') ||
    m.includes('user already') ||
    m.includes('email address is already registered') ||
    c.includes('already')
  ) {
    return 'Este e-mail já tem conta. Use Entrar ou outro e-mail.';
  }

  if (
    m.includes('password') &&
    (m.includes('least') ||
      m.includes('short') ||
      m.includes('weak') ||
      m.includes('longer') ||
      m.includes('strength') ||
      m.includes('hibp') ||
      m.includes('leaked'))
  ) {
    return `Senha recusada pelo servidor. Use pelo menos ${minPasswordLen} caracteres; se pedir mais forte, misture letras e números.`;
  }

  if (
    m.includes('redirect') ||
    m.includes('redirect_uri') ||
    m.includes('callback') ||
    m.includes('not allowed') && m.includes('url')
  ) {
    return 'O endereço de retorno não está autorizado. No Supabase: Authentication → URL Configuration → Redirect URLs — adicione a URL da app (ex.: http://localhost:8081/**).';
  }

  if (m.includes('captcha') || m.includes('hcaptcha') || m.includes('turnstile')) {
    return 'Este projeto exige CAPTCHA no login/cadastro. Ative-o na app ou desative no painel Supabase (Authentication → Attack Protection).';
  }

  if (m.includes('signup') && m.includes('disabled')) {
    return 'Cadastros por e-mail estão desativados no projeto Supabase.';
  }

  if (m.includes('invalid') && m.includes('email')) {
    return 'E-mail inválido. Confira se está correto.';
  }

  if (m.includes('email') && m.includes('format')) {
    return 'Formato de e-mail inválido.';
  }

  if (m.includes('database') || m.includes('unexpected_failure') || m.includes('hook')) {
    return 'Erro ao criar o perfil (base de dados ou hook). Tente outro nome de usuário ou peça ao admin para ver os logs do Supabase.';
  }

  const checklist =
    `O cadastro foi recusado (erro ${status ?? '?'}).\n\n` +
    `O que fazer:\n` +
    `• E-mail novo e válido.\n` +
    `• Senha com ${minPasswordLen}+ caracteres.\n` +
    `• Supabase → Authentication → URL Configuration: em Redirect URLs inclua a URL onde corres a app (ex.: http://localhost:8081/**).\n` +
    `• Authentication → Providers: e-mail ligado.\n` +
    `• Se já aplicou a migration do perfil (trigger), confirme na base de dados.\n\n` +
    (raw && raw.length > 0 && raw.length < 180 && !/^bad request$/i.test(raw) ? `Servidor: ${raw}` : '');

  if (status === 400 || status === 422 || /^bad request$/i.test(raw)) {
    return checklist.trim();
  }

  return raw || checklist.trim() || 'Não foi possível concluir o cadastro.';
}

/** Erros comuns do Supabase Auth em signInWithPassword (400, credenciais, e-mail não confirmado). */
export function formatAuthSignInError(error: unknown): string {
  const e = error as { message?: string; status?: number; code?: string };
  const raw = (e.message ?? (typeof error === 'string' ? error : '') ?? '').trim();
  const m = raw.toLowerCase();
  const c = String(e.code ?? '').toLowerCase();
  const status = e.status;

  if (
    status === 429 ||
    c.includes('429') ||
    m.includes('429') ||
    m.includes('too many requests') ||
    m.includes('rate limit')
  ) {
    return 'Muitas tentativas. Aguarde alguns minutos e tente de novo.';
  }

  if (
    m.includes('invalid login credentials') ||
    m.includes('invalid_grant') ||
    (m.includes('invalid') && m.includes('credentials')) ||
    m.includes('wrong password') ||
    m.includes('incorrect password')
  ) {
    return 'E-mail ou senha incorretos. Confira os dados ou use “Esqueci a senha”.';
  }

  if (
    m.includes('email not confirmed') ||
    m.includes('not confirmed') ||
    m.includes('confirm your email')
  ) {
    return 'Confirme o e-mail antes de entrar (verifique a caixa de entrada e o spam).';
  }

  if (m.includes('user') && (m.includes('banned') || m.includes('disabled'))) {
    return 'Esta conta está desativada. Contacte o suporte.';
  }

  if (m.includes('captcha') || m.includes('hcaptcha') || m.includes('turnstile')) {
    return 'Este projeto exige CAPTCHA. Ative-o na app ou desative Attack Protection no Supabase, conforme a política do projeto.';
  }

  if (m.includes('redirect') || m.includes('redirect_uri') || m.includes('callback')) {
    return 'URL de retorno não autorizada. No Supabase: Authentication → URL Configuration → adicione a URL da app (ex.: http://localhost:8081/**).';
  }

  if (m.includes('invalid') && m.includes('email')) {
    return 'E-mail inválido.';
  }

  if (status === 400 || /^bad request$/i.test(raw)) {
    return raw && raw.length > 0 && raw.length < 200
      ? raw
      : 'Não foi possível entrar. Confira e-mail e senha; se o problema continuar, verifique o painel Supabase (Auth → Providers).';
  }

  return raw || 'Não foi possível entrar. Tente de novo.';
}

/** Erros ao enviar e-mail de recuperação de senha. */
export function formatAuthPasswordResetError(error: unknown): string {
  const e = error as { message?: string; status?: number; code?: string };
  const raw = (e.message ?? (typeof error === 'string' ? error : '') ?? '').trim();
  const m = raw.toLowerCase();
  const status = e.status;

  if (
    status === 429 ||
    m.includes('429') ||
    m.includes('too many requests') ||
    m.includes('over_email_send_rate_limit') ||
    m.includes('rate limit')
  ) {
    return 'Muitos pedidos de e-mail. Aguarde alguns minutos antes de pedir de novo.';
  }

  if (m.includes('redirect') || m.includes('redirect_uri') || m.includes('not allowed') && m.includes('url')) {
    return 'URL de retorno não autorizada. No Supabase: Authentication → URL Configuration → Redirect URLs, inclua a URL da app.';
  }

  if (m.includes('invalid') && m.includes('email')) {
    return 'E-mail inválido.';
  }

  if (m.includes('captcha') || m.includes('hcaptcha') || m.includes('turnstile')) {
    return 'Recuperação bloqueada por CAPTCHA no projeto. Ajuste Attack Protection ou o fluxo na app.';
  }

  return raw || 'Não foi possível enviar o e-mail de recuperação. Tente de novo.';
}
