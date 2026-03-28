import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Mescla `app.json` com variáveis de ambiente (`.env` local ou EAS Secrets).
 * Prioridade: EXPO_PUBLIC_* > valores em app.json → extra.
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const extra = { ...(config.extra as Record<string, unknown>) };
  return {
    ...config,
    extra: {
      ...extra,
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? (extra.supabaseUrl as string) ?? '',
      supabaseAnonKey:
        process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? (extra.supabaseAnonKey as string) ?? '',
    },
  } as ExpoConfig;
};
