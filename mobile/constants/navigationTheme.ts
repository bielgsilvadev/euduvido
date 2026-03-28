import { colors } from '@/constants/theme';
import { DarkTheme, type Theme } from '@react-navigation/native';

export const DryLeagueNavigationTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.surfaceHigh,
    text: colors.onSurface,
    border: colors.outlineVariant,
    notification: colors.secondary,
  },
};
