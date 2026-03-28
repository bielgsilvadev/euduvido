import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function timeAgo(iso: string): string {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: ptBR });
  } catch {
    return '';
  }
}

export function profileInitials(displayName: string | null | undefined, username: string): string {
  const n = (displayName ?? '').trim() || username;
  const parts = n.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
  }
  return username.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2).toUpperCase() || 'DL';
}

export function workoutCategoryLabel(description: string): string {
  const d = description.trim();
  if (/corrida|run|km|pace/i.test(d)) return 'Corrida';
  if (/yoga|medita/i.test(d)) return 'Yoga';
  if (/cicl|bike|pedal/i.test(d)) return 'Ciclismo';
  if (/nata|pool/i.test(d)) return 'Natação';
  if (/box|luta/i.test(d)) return 'Combate';
  return 'Musculação';
}
