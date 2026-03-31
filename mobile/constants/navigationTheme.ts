import { colors } from '@/constants/theme';
import { DarkTheme, type Theme } from '@react-navigation/native';

export const AppNavigationTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.surfaceHigh,
    text: colors.onSurface,
    border: colors.outlineVariant,
    notification: colors.red,
  },
};

/** @deprecated use AppNavigationTheme */
export const DryLeagueNavigationTheme = AppNavigationTheme;
