import { colors, fonts, radii, spacing } from '@/constants/theme';
import type { LeagueRow } from '@/types/models';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

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
        style={({ pressed }) => (pressed ? styles.pressablePressed : undefined)}>
        <View style={styles.card}>
          <View style={styles.accentRail} />
          <View style={styles.body}>
            <View style={styles.top}>
              <Text style={[styles.title, { fontFamily: fonts.display }]} numberOfLines={2}>
                {league.name.toUpperCase()}
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
            <View style={styles.statsBar}>
              <View style={styles.stat}>
                <View style={styles.statIconWrap}>
                  <Ionicons name="people" size={15} color={colors.primary} />
                </View>
                <Text style={[styles.statText, { fontFamily: fonts.bodySemi }]}>
                  {memberCount ?? '—'} / {league.max_participants} atletas
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={[styles.stat, styles.statWide]}>
                <View style={[styles.statIconWrap, styles.statIconGold]}>
                  <Ionicons name="trophy" size={14} color={colors.gold} />
                </View>
                <Text style={[styles.statText, { fontFamily: fonts.body }]} numberOfLines={1}>
                  {league.prize_distribution === 'winner_take_all'
                    ? 'Vencedor leva tudo'
                    : league.prize_distribution === 'top_3'
                      ? 'Top 3'
                      : 'Proporcional'}
                </Text>
              </View>
            </View>
            <View style={styles.ctaRow}>
              <Text style={[styles.ctaText, { fontFamily: fonts.bodySemi }]}>Ver liga</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.primary} />
            </View>
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  pressablePressed: {
    opacity: 0.94,
    transform: [{ scale: 0.995 }],
  },
  /** Borda no `View` interno: evita o Link/web ignorar borda no Pressable; cor sólida bem visível. */
  card: {
    flexDirection: 'row',
    backgroundColor: colors.bgCardAlt,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
      web: {
        borderStyle: 'solid',
        boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
      },
      default: {},
    }),
  },
  accentRail: {
    width: 4,
    backgroundColor: colors.primary,
    opacity: 0.85,
  },
  body: {
    flex: 1,
    paddingVertical: spacing.lg + spacing.xs,
    paddingRight: spacing.lg + spacing.xs,
    paddingLeft: spacing.lg,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  title: {
    flex: 1,
    color: colors.onSurface,
    fontSize: 22,
    letterSpacing: 0.8,
    lineHeight: 26,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  badgeFree: {
    backgroundColor: colors.accentGlow,
    borderColor: 'rgba(200,241,53,0.35)',
  },
  badgePaid: {
    backgroundColor: colors.goldDim,
    borderColor: 'rgba(255,184,48,0.35)',
  },
  badgeText: { fontSize: 12, letterSpacing: 0.2 },
  badgeTextFree: { color: colors.primary },
  badgeTextPaid: { color: colors.gold },
  desc: {
    marginTop: spacing.sm,
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surfaceHigh,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  statWide: {
    flex: 1,
    minWidth: 0,
  },
  statIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(200,241,53,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIconGold: {
    backgroundColor: colors.goldDim,
  },
  statDivider: {
    width: 1,
    height: 22,
    backgroundColor: colors.border,
  },
  statText: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
    flexShrink: 1,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: spacing.md,
    gap: 4,
  },
  ctaText: {
    color: colors.primary,
    fontSize: 13,
    letterSpacing: 0.3,
  },
});
