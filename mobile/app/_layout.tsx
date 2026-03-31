import { AppToasts } from '@/components/AppToasts';
import { NativeToastHost } from '@/components/NativeToastHost';
import { AppNavigationTheme } from '@/constants/navigationTheme';
import { colors } from '@/constants/theme';
import { AuthProvider } from '@/context/AuthContext';
import {
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import { ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { LoadingLogo } from '@/components/ui/LoadingLogo';
import { Platform, View } from 'react-native';
import 'react-native-reanimated';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'index',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const pathname = usePathname();
  const [loaded, error] = useFonts({
    SpaceGrotesk_700Bold,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  /** Web: tira o foco do link/botão ao mudar de rota, evitando aviso aria-hidden + foco na pilha. */
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const id = requestAnimationFrame(() => {
      const el = document.activeElement as HTMLElement | null;
      el?.blur?.();
    });
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  if (!loaded) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <LoadingLogo />
      </View>
    );
  }

  return (
    <AuthProvider>
      <ThemeProvider value={AppNavigationTheme}>
        <AppToasts />
        <NativeToastHost />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
          }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(onboarding)" />
          <Stack.Screen name="(app)" />
        </Stack>
      </ThemeProvider>
    </AuthProvider>
  );
}
