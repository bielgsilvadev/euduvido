import { colors, fonts } from '@/constants/theme';
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surfaceHigh },
        headerTintColor: colors.onSurface,
        headerTitleStyle: { fontFamily: fonts.displayMedium },
        contentStyle: { backgroundColor: colors.background },
      }}>
      <Stack.Screen name="login" options={{ title: 'Entrar', headerShown: true }} />
      <Stack.Screen name="register" options={{ title: 'Criar conta', headerShown: true }} />
    </Stack>
  );
}
