import { colors, fonts } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

export default function AppGroupLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} size="large" />
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
      <Stack.Screen name="league/[id]" options={{ title: 'Liga' }} />
      <Stack.Screen name="user/[id]" options={{ title: 'Perfil' }} />
      <Stack.Screen name="post/[id]" options={{ title: 'Treino' }} />
      <Stack.Screen name="settings" options={{ title: 'Ajustes' }} />
      <Stack.Screen name="create-league" options={{ title: 'Nova liga', presentation: 'modal' }} />
    </Stack>
  );
}
