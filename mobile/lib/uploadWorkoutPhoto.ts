import { supabase } from '@/lib/supabase';
import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system/legacy';

export async function uploadWorkoutPhoto(userId: string, localUri: string): Promise<string | null> {
  const ext = (localUri.split('.').pop() ?? 'jpg').toLowerCase();
  const safeExt = ext === 'png' ? 'png' : 'jpg';
  const path = `${userId}/${Date.now()}.${safeExt}`;
  const base64 = await FileSystem.readAsStringAsync(localUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const body = decode(base64);
  const contentType = safeExt === 'png' ? 'image/png' : 'image/jpeg';

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
