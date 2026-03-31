import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/models';
import type { PostgrestError } from '@supabase/supabase-js';

export type ProfileFetchMeta = {
  profile: Profile | null;
  /** Se definido, o utilizador está autenticado mas não pode usar a app até resolver (BD/migrations). */
  issue: string | null;
};

function isMissingProfilesTable(error: PostgrestError): boolean {
  const msg = (error.message ?? '').trim();
  const code = String(error.code ?? '');
  const details = `${msg} ${error.details ?? ''} ${error.hint ?? ''}`;
  const status = (error as { statusCode?: number }).statusCode;
  if (status === 404 && /profiles|schema cache|could not find the table/i.test(details)) {
    return true;
  }
  if (/PGRST205|PGRST202/i.test(code)) {
    return true;
  }
  return (
    /could not find the table|schema cache|relation .* does not exist|42p01/i.test(msg) ||
    /could not find the table|schema cache|relation .* does not exist/i.test(details)
  );
}

function classifyPostgrestError(error: PostgrestError): string {
  const msg = (error.message ?? '').trim();
  const code = error.code ?? '';
  const details = `${msg} ${error.details ?? ''} ${error.hint ?? ''}`.toLowerCase();

  if (isMissingProfilesTable(error)) {
    return (
      'A tabela public.profiles não existe neste projeto Supabase (o browser mostra 404 em /profiles até isto ser corrigido). ' +
      'No Dashboard: SQL Editor → cole e execute o ficheiro supabase/full_setup_one_shot.sql do repositório (ou as migrations em ordem). ' +
      'Depois: Table Editor → confirme a tabela profiles.'
    );
  }

  if (
    code === '42501' ||
    /permission denied|rls|row-level security|policy|jwt/i.test(msg) ||
    /permission denied|rls|policy/i.test(details)
  ) {
    return (
      'Sem permissão para ler o perfil (RLS ou políticas). ' +
      'No Supabase, confira as policies da tabela profiles para SELECT ao utilizador autenticado.'
    );
  }

  if (/fetch|network|failed to fetch|load failed|econnrefused|timeout/i.test(msg)) {
    return 'Sem ligação ou o servidor não respondeu. Verifique a internet e tente de novo.';
  }

  if (msg.length > 0 && msg.length < 220) {
    return `Não foi possível carregar o perfil: ${msg}`;
  }

  return 'Não foi possível carregar o perfil. Tente de novo ou contacte o suporte.';
}

/**
 * Carrega o perfil com maybeSingle (0 linhas = conta sem linha em profiles, sem erro PGRST116).
 */
export async function fetchProfileWithMeta(userId: string): Promise<ProfileFetchMeta> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();

  if (error) {
    return { profile: null, issue: classifyPostgrestError(error) };
  }

  if (!data) {
    return {
      profile: null,
      issue:
        'A sua conta não tem registo na tabela profiles (o trigger handle_new_user pode não estar aplicado). ' +
        'Execute as migrations do repositório no SQL Editor do Supabase ou peça ajuda a quem gere o projeto.',
    };
  }

  return { profile: data as Profile, issue: null };
}
