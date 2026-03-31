import { Image } from 'expo-image';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, type StyleProp, StyleSheet, type ViewStyle } from 'react-native';

const SOURCE = require('@/assets/images/logo-raio.png');

const SIZE_PX = { small: 26, large: 64 } as const;

type Props = {
  /** `large` — ecrãs completos; `small` — botões e badges. */
  size?: 'small' | 'large' | number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Indicador de carregamento com o logo raio da identidade (rotação contínua).
 */
export function LoadingLogo({ size = 'large', style }: Props) {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1100,
        easing: Easing.linear,
        useNativeDriver: Platform.OS !== 'web',
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [spin]);

  const px = typeof size === 'number' ? size : SIZE_PX[size];
  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[styles.box, { width: px, height: px }, style, { transform: [{ rotate }] }]}
      accessibilityRole="progressbar"
      accessibilityLabel="A carregar"
      accessibilityState={{ busy: true }}>
      <Image source={SOURCE} style={{ width: px, height: px }} contentFit="contain" />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
