import { colors, fonts, radii, spacing } from '@/constants/theme';
import type { LeagueRow } from '@/types/models';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  league: LeagueRow;
  memberCount?: number;
};

export function LeagueCard({ league, memberCount }: Props) {
  const isPaid = league.league_type === 'paid';
  const fee = (league.entry_fee_cents / 100).toFixed(2);

  return (
    <Link href={`/(app)/league/${league.id}`} asChild>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Liga ${league.name}`}
        style={({ pressed }) => [styles.card, pressed && { borderColor: colors.borderLight }]}>
        <View style={styles.top}>
          <Text style={[styles.title, { fontFamily: fonts.displayMedium }]} numberOfLines={2}>
            {league.name}
          </Text>
          <View style={[styles.badge, isPaid ? styles.badgePaid : styles.badgeFree]}>
            <Text
              style={[
                styles.badgeText,
                { fontFamily: fonts.bodySemi },
                isPaid ? styles.badgeTextPaid : styles.badgeTextFree,
              ]}>
              {isPaid ? `R$ ${fee}` : 'Grátis'}
            </Text>
          </View>
        </View>
        {league.description ? (
          <Text style={[styles.desc, { fontFamily: fonts.body }]} numberOfLines={2}>
            {league.description}
          </Text>
        ) : null}
        <View style={styles.footer}>
          <View style={styles.stat}>
            <Ionicons name="people-outline" size={16} color={colors.onSurfaceVariant} />
            <Text style={[styles.statText, { fontFamily: fonts.body }]}>
              {memberCount ?? '—'} / {league.max_participants}
            </Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="trophy-outline" size={16} color={colors.gold} />
            <Text style={[styles.statText, { fontFamily: fonts.body }]}>
              {league.prize_distribution === 'winner_take_all'
                ? 'Vencedor leva tudo'
                : league.prize_distribution === 'top_3'
                  ? 'Top 3'
                  : 'Proporcional'}
            </Text>
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  title: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.pill,
  },
  badgeFree: {
    backgroundColor: colors.accentGlow,
  },
  badgePaid: {
    backgroundColor: colors.goldDim,
  },
  badgeText: { fontSize: 12 },
  badgeTextFree: { color: colors.primary },
  badgeTextPaid: { color: colors.gold },
  desc: {
    marginTop: spacing.sm,
    color: colors.onSurfaceVariant,
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    marginTop: spacing.md,
    gap: spacing.lg,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    color: colors.onSurfaceVariant,
    fontSize: 13,
  },
});
