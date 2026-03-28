import { colors, fonts, radii, spacing } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  title: string;
  subtitle?: string;
};

export function AlertBanner({ title, subtitle }: Props) {
  return (
    <View style={styles.wrap} accessibilityRole="alert">
      <Ionicons name="flame" size={18} color={colors.gold} style={styles.icon} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { fontFamily: fonts.bodySemi }]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.sub, { fontFamily: fonts.body }]}>{subtitle}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    backgroundColor: 'rgba(255,184,48,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,184,48,0.2)',
    marginBottom: spacing.md,
  },
  icon: { marginTop: 2 },
  title: { fontSize: 13, fontWeight: '600', color: colors.gold },
  sub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
});
