import { Platform } from 'react-native';

/** Domínio público quando a app nativa abre o browser (sem .env). */
/** Troque pelo teu domínio (ex.: deploy Vercel do Eu Duvido!) ou use EXPO_PUBLIC_LEGAL_* no .env */
const DEFAULT_PUBLIC_ORIGIN = 'https://euduvido.vercel.app';

/**
 * URL dos termos: env > origem atual (web) > domínio de produção.
 */
export function legalTermsUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_LEGAL_TERMS_URL?.trim();
  if (fromEnv) return fromEnv;
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `${window.location.origin}/terms`;
  }
  return `${DEFAULT_PUBLIC_ORIGIN}/terms`;
}

export function legalPrivacyUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_LEGAL_PRIVACY_URL?.trim();
  if (fromEnv) return fromEnv;
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `${window.location.origin}/privacy`;
  }
  return `${DEFAULT_PUBLIC_ORIGIN}/privacy`;
}
