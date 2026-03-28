import { colors, fonts } from '@/constants/theme';
import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surfaceHigh },
        headerTintColor: colors.onSurface,
        headerTitleStyle: { fontFamily: fonts.displayMedium },
        contentStyle: { backgroundColor: colors.background },
        title: 'Bem-vindo',
      }}
    />
  );
}
