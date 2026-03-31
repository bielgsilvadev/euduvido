import { localImageUriToUploadBytes } from '@/lib/localImageForUpload';
import { supabase } from '@/lib/supabase';

export async function uploadWorkoutPhoto(userId: string, localUri: string): Promise<string | null> {
  const { body, contentType, safeExt } = await localImageUriToUploadBytes(localUri);
  const path = `${userId}/${Date.now()}.${safeExt}`;

  const { data, error } = await supabase.storage.from('workout-photos').upload(path, body, {
    contentType,
    upsert: false,
  });

  if (error) {
    console.warn('uploadWorkoutPhoto', error.message);
    return null;
  }

  const { data: pub } = supabase.storage.from('workout-photos').getPublicUrl(data.path);
  return pub.publicUrl;
}
