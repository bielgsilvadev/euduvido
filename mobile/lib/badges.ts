import { colors } from '@/constants/theme';
import type { Ionicons } from '@expo/vector-icons';

const ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  barbell: 'barbell-outline',
  flame: 'flame-outline',
  shield: 'shield-checkmark-outline',
  flash: 'flash-outline',
  analytics: 'analytics-outline',
  sun: 'sunny-outline',
  moon: 'moon-outline',
  calendar: 'calendar-outline',
  globe: 'globe-outline',
  chat: 'chatbubble-ellipses-outline',
  heart: 'heart-outline',
  people: 'people-outline',
  person: 'person-outline',
  star: 'star-outline',
  trophy: 'trophy-outline',
  ribbon: 'ribbon-outline',
  medal: 'medal-outline',
  cash: 'cash-outline',
  scale: 'scale-outline',
  flag: 'flag-outline',
};

const COLOR_MAP: Record<string, string> = {
  barbell: colors.accent,
  flame: '#FF6B35',
  shield: colors.accent,
  flash: colors.gold,
  analytics: colors.blue,
  sun: colors.gold,
  moon: colors.purple,
  calendar: colors.blue,
  globe: colors.accent,
  chat: colors.textMuted,
  heart: '#E85D75',
  people: colors.blue,
  person: colors.accent,
  star: colors.gold,
  trophy: colors.gold,
  ribbon: colors.gold,
  medal: colors.gold,
  cash: colors.accent,
  scale: colors.blue,
  flag: colors.accent,
};

export function badgeIconName(iconKey: string): keyof typeof Ionicons.glyphMap {
  return ICON_MAP[iconKey] ?? 'ribbon-outline';
}

export function badgeAccentColor(iconKey: string): string {
  return COLOR_MAP[iconKey] ?? colors.textMuted;
}
