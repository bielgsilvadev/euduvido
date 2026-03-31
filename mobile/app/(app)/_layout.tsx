import { LoadingLogo } from '@/components/ui/LoadingLogo';
import { colors, fonts } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { Redirect, Stack } from 'expo-router';
import { View } from 'react-native';

export default function AppGroupLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <LoadingLogo />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surfaceHigh },
        headerTintColor: colors.onSurface,
        headerTitleStyle: { fontFamily: fonts.displayMedium },
        contentStyle: { backgroundColor: colors.background },
      }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="user/[id]" options={{ headerShown: false }} />
      <Stack.Screen
        name="create-challenge"
        options={{ title: 'Criar desafio', headerShown: false, presentation: 'modal' }}
      />
      <Stack.Screen name="challenge/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ title: 'Configurações', headerShown: true }} />
      <Stack.Screen name="achievements" options={{ title: 'Conquistas', headerShown: true }} />
    </Stack>
  );
}
