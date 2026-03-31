import { LoadingLogo } from '@/components/ui/LoadingLogo';
import { Screen } from '@/components/ui/Screen';
import { colors, fonts, radii, spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { fetchBadgesWithEarned } from '@/lib/api';
import { badgeAccentColor, badgeIconName } from '@/lib/badges';
import type { BadgeWithEarned } from '@/types/models';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

export default function AchievementsScreen() {
  const { user } = useAuth();
  const [rows, setRows] = useState<BadgeWithEarned[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user?.id) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setRows(await fetchBadgesWithEarned(user.id));
    setLoading(false);
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const earned = rows.filter((r) => r.earned).length;

  if (loading && !rows.length) {
    return (
      <Screen edges={['bottom']} belowNativeHeader>
        <View style={styles.center}>
          <LoadingLogo />
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={['bottom']} belowNativeHeader>
      <View style={styles.summary}>
        <Text style={[styles.summaryNum, { fontFamily: fonts.display }]}>{earned}</Text>
        <Text style={[styles.summaryLbl, { fontFamily: fonts.body }]}>conquistas desbloqueadas no Eu Duvido!</Text>
      </View>

      <FlatList
        data={rows}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, rows.length === 0 && styles.listEmpty]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={[styles.empty, { fontFamily: fonts.body }]}>
            Nenhuma conquista listada. Confirme a migration `20260329150000_badges_user_badges` no Supabase.
          </Text>
        }
        renderItem={({ item }) => {
          const accent = badgeAccentColor(item.icon_key);
          const icon = badgeIconName(item.icon_key);
          return (
            <View style={[styles.card, !item.earned && styles.cardLocked]}>
              <View
                style={[
                  styles.iconWrap,
                  {
                    backgroundColor: item.earned ? `${accent}22` : colors.bgCardAlt,
                    borderColor: item.earned ? `${accent}44` : colors.border,
                  },
                ]}>
                <Ionicons name={icon} size={28} color={item.earned ? accent : colors.textDim} />
              </View>
              <View style={styles.cardBody}>
                <Text style={[styles.cardTitle, { fontFamily: fonts.bodySemi }]}>{item.name}</Text>
                <Text style={[styles.cardDesc, { fontFamily: fonts.body }]}>{item.description}</Text>
                {item.earned && item.earned_at ? (
                  <Text style={[styles.cardMeta, { fontFamily: fonts.body }]}>
                    Desbloqueada em{' '}
                    {format(new Date(item.earned_at), "d 'de' MMM yyyy", { locale: ptBR })}
                  </Text>
                ) : (
                  <Text style={[styles.cardMetaLocked, { fontFamily: fonts.body }]}>Ainda bloqueada</Text>
                )}
              </View>
            </View>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  summary: { alignItems: 'center', marginBottom: spacing.lg },
  summaryNum: { fontSize: 40, color: colors.accent, letterSpacing: 0.5 },
  summaryLbl: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
  list: { paddingBottom: spacing.xxl, gap: spacing.sm },
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardLocked: { opacity: 0.72 },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  cardBody: { flex: 1, minWidth: 0 },
  cardTitle: { fontSize: 16, color: colors.text, marginBottom: 4 },
  cardDesc: { fontSize: 13, color: colors.textMuted, lineHeight: 19 },
  cardMeta: { fontSize: 11, color: colors.accentDim, marginTop: 8 },
  cardMetaLocked: { fontSize: 11, color: colors.textMuted, marginTop: 8 },
  listEmpty: { flexGrow: 1 },
  empty: { textAlign: 'center', color: colors.textMuted, paddingVertical: spacing.xl, lineHeight: 22 },
});
