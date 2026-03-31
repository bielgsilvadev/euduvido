import { localImageUriToUploadBytes } from '@/lib/localImageForUpload';
import { supabase } from '@/lib/supabase';

/** Usa o bucket `workout-photos` (mesmas policies: pasta = user id). Novo ficheiro por upload para evitar cache antigo. */
export async function uploadProfileAvatar(userId: string, localUri: string): Promise<string | null> {
  const { body, contentType, safeExt } = await localImageUriToUploadBytes(localUri);
  const path = `${userId}/avatar-${Date.now()}.${safeExt}`;

  const { data, error } = await supabase.storage.from('workout-photos').upload(path, body, {
    contentType,
    upsert: false,
  });

  if (error) {
    console.warn('uploadProfileAvatar', error.message);
    return null;
  }

  const { data: pub } = supabase.storage.from('workout-photos').getPublicUrl(data.path);
  return pub.publicUrl;
}
