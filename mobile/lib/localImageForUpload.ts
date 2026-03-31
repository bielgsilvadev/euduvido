import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

export type ImageUploadBytes = { body: ArrayBuffer; contentType: string; safeExt: 'jpg' | 'png' };

/**
 * Converte URI local (galeria/câmera) em bytes para o Storage.
 * Na web não existe `expo-file-system.readAsStringAsync` — usa-se `fetch(blob:)`.
 */
export async function localImageUriToUploadBytes(localUri: string): Promise<ImageUploadBytes> {
  if (Platform.OS === 'web') {
    const res = await fetch(localUri);
    const blob = await res.blob();
    const body = await blob.arrayBuffer();
    const ct = (blob.type || '').toLowerCase();
    let safeExt: 'jpg' | 'png' = 'jpg';
    let contentType = 'image/jpeg';
    if (ct.includes('png')) {
      safeExt = 'png';
      contentType = 'image/png';
    } else if (ct.includes('jpeg') || ct.includes('jpg')) {
      safeExt = 'jpg';
      contentType = 'image/jpeg';
    } else {
      const pathBit = localUri.split(/[#?]/)[0]?.split('.').pop()?.toLowerCase() ?? '';
      if (pathBit === 'png') {
        safeExt = 'png';
        contentType = 'image/png';
      }
    }
    return { body, contentType, safeExt };
  }

  const pathPart = localUri.split(/[#?]/)[0] ?? localUri;
  const ext = (pathPart.split('.').pop() ?? 'jpg').toLowerCase();
  const safeExt: 'jpg' | 'png' = ext === 'png' ? 'png' : 'jpg';
  const base64 = await FileSystem.readAsStringAsync(localUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return {
    body: decode(base64),
    contentType: safeExt === 'png' ? 'image/png' : 'image/jpeg',
    safeExt,
  };
}
