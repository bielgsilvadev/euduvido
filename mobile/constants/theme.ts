/**
 * Eu Duvido! — tema escuro + verde lima da marca (#C8F135), alinhado ao logo.
 * `primary` / `accent` = verde; `secondary` (no PrimaryButton danger) = vermelho; `tertiary` = ouro (botões secundários).
 */

import type { TextStyle } from 'react-native';

export const themeColors = {
  lime: '#C8F135',
  limeDark: '#9BC220',
  limeLight: '#D8F570',
  bg: '#0A0A0B',
  bgCard: '#111114',
  bgCardAlt: '#16161A',
  border: '#1E1E24',
  borderLight: '#2A2A32',
  success: '#10B981',
  danger: '#EF4444',
  warning: '#FFB830',
  info: '#4D9FFF',
  textPrimary: '#F0F0F2',
  textSecondary: '#6B6B7A',
  textMuted: '#3A3A44',
  /** “Eu Acredito!” — verde de apoio */
  cheerColor: '#C8F135',
  /** “Eu Duvido!” — contraste sem laranja de marca: ouro */
  doubtColor: '#FFB830',
} as const;

export const colors = {
  bg: themeColors.bg,
  bgCard: themeColors.bgCard,
  bgCardAlt: themeColors.bgCardAlt,
  border: themeColors.border,
  borderLight: themeColors.borderLight,
  accent: themeColors.lime,
  accentDim: themeColors.limeDark,
  accentGlow: 'rgba(200,241,53,0.15)',
  red: '#FF4D4D',
  redDim: 'rgba(255,77,77,0.15)',
  blue: themeColors.info,
  blueDim: 'rgba(77,159,255,0.12)',
  gold: themeColors.warning,
  goldDim: 'rgba(255,184,48,0.15)',
  purple: '#A855F7',
  purpleDim: 'rgba(168,85,247,0.15)',
  text: themeColors.textPrimary,
  textMuted: themeColors.textSecondary,
  textSecondary: themeColors.textSecondary,
  textDim: themeColors.textMuted,
  background: themeColors.bg,
  surfaceLowest: themeColors.bg,
  surface: themeColors.bg,
  surfaceHigh: themeColors.bgCard,
  surfaceVariant: 'rgba(17,17,20,0.95)',
  primary: themeColors.lime,
  primaryDim: themeColors.limeDark,
  onPrimary: '#000000',
  /** Usado como fundo do botão danger no PrimaryButton */
  secondary: '#FF4D4D',
  tertiary: themeColors.warning,
  onSurface: themeColors.textPrimary,
  onSurfaceVariant: themeColors.textSecondary,
  outlineVariant: themeColors.border,
  scrim: 'rgba(0,0,0,0.8)',
  glassBorder: themeColors.border,
  success: themeColors.success,
  danger: themeColors.danger,
  cheer: themeColors.cheerColor,
  doubt: themeColors.doubtColor,
} as const;

export const workoutImageTints = ['#1D3A1A', '#1A1D3A', '#3A1A2A', '#1A3A3A', '#3A3A1A'] as const;

export function tintForId(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h + id.charCodeAt(i) * (i + 1)) % 997;
  return workoutImageTints[h % workoutImageTints.length];
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const screenPaddingX = spacing.md;

export const stackHeaderContentGap = spacing.lg;

export function contentTopPadding(safeTop: number): number {
  return Math.max(safeTop + 8, 20);
}

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

export const fonts = {
  display: 'SpaceGrotesk_700Bold',
  displayMedium: 'SpaceGrotesk_700Bold',
  body: 'Inter_500Medium',
  bodySemi: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
  mono: 'SpaceMono',
} as const;

export const formTextInputStyle: TextStyle = {
  backgroundColor: colors.bgCardAlt,
  borderRadius: radii.md,
  borderWidth: 1,
  borderColor: colors.borderLight,
  paddingVertical: 14,
  paddingHorizontal: spacing.md + 4,
  marginHorizontal: spacing.xs,
  color: colors.onSurface,
  fontSize: 16,
  minHeight: 48,
};
