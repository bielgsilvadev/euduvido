import { colors, fonts, radii } from '@/constants/theme';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

type Variant = 'accent' | 'red' | 'gold' | 'blue' | 'purple' | 'muted';

const variantStyles: Record<Variant, { bg: string; fg: string }> = {
  accent: { bg: colors.accentGlow, fg: colors.accent },
  red: { bg: colors.redDim, fg: colors.red },
  gold: { bg: colors.goldDim, fg: colors.gold },
  blue: { bg: colors.blueDim, fg: colors.blue },
  purple: { bg: colors.purpleDim, fg: colors.purple },
  muted: { bg: 'rgba(0,0,0,0.45)', fg: colors.textMuted },
};

type Props = {
  children: string;
  variant?: Variant;
  style?: ViewStyle;
  /** Ícone ou elemento antes do rótulo (ex.: globo no pill “Global”). */
  leading?: ReactNode;
};

export function Pill({ children, variant = 'accent', style, leading }: Props) {
  const v = variantStyles[variant];
  return (
    <View style={[styles.wrap, { backgroundColor: v.bg }, style]}>
      <View style={styles.row}>
        {leading}
        <Text style={[styles.txt, { color: v.fg, fontFamily: fonts.bodySemi }]} numberOfLines={1}>
          {children}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  txt: { fontSize: 11, fontWeight: '600' },
});
