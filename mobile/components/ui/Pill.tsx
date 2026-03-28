import { colors, fonts, radii } from '@/constants/theme';
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
};

export function Pill({ children, variant = 'accent', style }: Props) {
  const v = variantStyles[variant];
  return (
    <View style={[styles.wrap, { backgroundColor: v.bg }, style]}>
      <Text style={[styles.txt, { color: v.fg, fontFamily: fonts.bodySemi }]} numberOfLines={1}>
        {children}
      </Text>
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
  txt: { fontSize: 11, fontWeight: '600' },
});
