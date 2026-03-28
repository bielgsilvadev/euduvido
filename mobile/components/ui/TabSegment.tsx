import { colors, fonts, radii, spacing } from '@/constants/theme';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  tabs: { key: string; label: string }[];
  active: string;
  onChange: (key: string) => void;
};

export function TabSegment({ tabs, active, onChange }: Props) {
  return (
    <View style={styles.bar}>
      {tabs.map((t) => {
        const on = t.key === active;
        return (
          <Pressable
            key={t.key}
            onPress={() => onChange(t.key)}
            style={[styles.item, on && styles.itemOn]}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}>
            <Text style={[styles.label, { fontFamily: fonts.bodySemi }, on && styles.labelOn]}>{t.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.bgCardAlt,
    borderRadius: radii.md,
    padding: 4,
    gap: 2,
  },
  item: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radii.sm,
    alignItems: 'center',
  },
  itemOn: {
    backgroundColor: colors.bgCard,
  },
  label: {
    fontSize: 13,
    color: colors.textMuted,
  },
  labelOn: {
    color: colors.text,
  },
});
