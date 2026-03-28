/**
 * DryLeague — layout alinhado ao protótipo (Bebas + DM Sans, lime #C8F135)
 */

export const colors = {
  bg: '#0A0A0B',
  bgCard: '#111114',
  bgCardAlt: '#16161A',
  border: '#1E1E24',
  borderLight: '#2A2A32',
  accent: '#C8F135',
  accentDim: '#9BC220',
  accentGlow: 'rgba(200,241,53,0.15)',
  red: '#FF4D4D',
  redDim: 'rgba(255,77,77,0.15)',
  blue: '#4D9FFF',
  blueDim: 'rgba(77,159,255,0.12)',
  gold: '#FFB830',
  goldDim: 'rgba(255,184,48,0.15)',
  purple: '#A855F7',
  purpleDim: 'rgba(168,85,247,0.15)',
  text: '#F0F0F2',
  textMuted: '#6B6B7A',
  textDim: '#3A3A44',
  // aliases usados no código legado
  background: '#0A0A0B',
  surfaceLowest: '#0A0A0B',
  surface: '#0A0A0B',
  surfaceHigh: '#111114',
  surfaceVariant: 'rgba(17,17,20,0.95)',
  primary: '#C8F135',
  primaryDim: '#9BC220',
  onPrimary: '#000000',
  secondary: '#FF4D4D',
  tertiary: '#FFB830',
  onSurface: '#F0F0F2',
  onSurfaceVariant: '#6B6B7A',
  outlineVariant: '#1E1E24',
  scrim: 'rgba(0,0,0,0.8)',
  glassBorder: '#1E1E24',
} as const;

/** Tons atrás do hero do card (como no mock) */
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

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

export const fonts = {
  display: 'BebasNeue_400Regular',
  displayMedium: 'BebasNeue_400Regular',
  body: 'DMSans_500Medium',
  bodySemi: 'DMSans_600SemiBold',
  bodyBold: 'DMSans_700Bold',
  mono: 'SpaceMono',
} as const;
