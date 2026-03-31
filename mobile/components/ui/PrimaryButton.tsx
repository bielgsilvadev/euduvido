import { colors, fonts, radii } from '@/constants/theme';
import * as Haptics from 'expo-haptics';
import React, { type ReactNode } from 'react';
import { LoadingLogo } from '@/components/ui/LoadingLogo';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

type Props = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  style?: ViewStyle;
  accessibilityLabel?: string;
  /** Ícone à esquerda do título (ex.: login social). */
  leftIcon?: ReactNode;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function PrimaryButton({
  title,
  onPress,
  disabled,
  loading,
  variant = 'primary',
  style,
  accessibilityLabel,
  leftIcon,
}: Props) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 16, stiffness: 320 });
    if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 14, stiffness: 280 });
  };

  const bg =
    variant === 'primary'
      ? colors.primary
      : variant === 'secondary'
        ? colors.tertiary
        : variant === 'danger'
          ? colors.secondary
          : 'transparent';
  const fg =
    variant === 'primary' || variant === 'secondary'
      ? colors.onPrimary
      : variant === 'danger'
        ? colors.text
        : colors.textMuted;

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: !!disabled || !!loading }}
      disabled={disabled || loading}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.base,
        { backgroundColor: bg },
        variant === 'ghost' && styles.ghost,
        disabled && !loading && styles.disabled,
        style,
        animStyle,
      ]}>
      {loading ? (
        Platform.OS === 'web' ? (
          <ActivityIndicator color={fg} size="small" accessibilityLabel="A carregar" />
        ) : (
          <LoadingLogo size="small" />
        )
      ) : (
        <View style={styles.row}>
          {leftIcon ? <View style={styles.iconSlot}>{leftIcon}</View> : null}
          <Text style={[styles.label, { color: fg, fontFamily: fonts.bodySemi }]}>{title}</Text>
        </View>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  ghost: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  disabled: {
    opacity: 0.45,
  },
  label: {
    fontSize: 16,
    letterSpacing: 0.2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  iconSlot: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
