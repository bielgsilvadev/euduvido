import { BrandLogo } from '@/components/BrandLogo';
import { LoadingLogo } from '@/components/ui/LoadingLogo';
import { colors, fonts, screenPaddingX, spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const SPLASH_MIN_MS = 2000;

export default function IndexGate() {
  const { user, profile, loading } = useAuth();
  const [minElapsed, setMinElapsed] = useState(false);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const t = setTimeout(() => setMinElapsed(true), SPLASH_MIN_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!loading) {
      opacity.value = withTiming(1, { duration: 420 });
    }
  }, [loading, opacity]);

  const fadeStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  const showSplash = loading || !minElapsed;

  if (showSplash) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: screenPaddingX,
          paddingVertical: spacing.lg,
          gap: spacing.md,
        }}>
        <Animated.View style={[{ alignItems: 'center', gap: spacing.sm }, fadeStyle]}>
          <BrandLogo maxWidth={240} />
          <Text style={{ fontFamily: fonts.display, fontSize: 28, color: colors.accent }}>Eu Duvido!</Text>
          <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.textMuted, textAlign: 'center' }}>
            Desafios com aposta real. Prove — ou a comunidade duvida.
          </Text>
        </Animated.View>
        {loading ? <LoadingLogo style={{ marginTop: spacing.lg }} /> : null}
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  if (!profile?.onboarding_completed) {
    return <Redirect href="/(onboarding)" />;
  }

  return <Redirect href="/(app)/(tabs)/feed" />;
}
