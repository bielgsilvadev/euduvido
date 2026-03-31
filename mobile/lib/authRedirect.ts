import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

/** URL usada em emailRedirectTo (signup) e redirectTo (recuperação de senha). */
export function getAuthRedirectUrl(path = '/'): string | undefined {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    try {
      return new URL(path, window.location.origin).toString();
    } catch {
      return `${window.location.origin}${path.startsWith('/') ? path : `/${path}`}`;
    }
  }
  try {
    return Linking.createURL(path);
  } catch {
    return undefined;
  }
}
