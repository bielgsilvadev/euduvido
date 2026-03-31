import { colors, fonts, radii, spacing } from '@/constants/theme';
import { profileInitials } from '@/lib/format';
import type { LeagueMemberRow } from '@/types/models';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  rank: number;
  item: LeagueMemberRow;
  leagueName: string;
};

export function LeagueRankingRow({ rank, item, leagueName }: Props) {
  const p = item.profile;
  const title = p?.display_name || p?.username || '—';
  const initials = p ? profileInitials(p.display_name, p.username) : '—';
  const streak = p?.streak_current ?? 0;

  return (
    <Link href={`/(app)/user/${item.user_id}`} asChild>
      <Pressable style={styles.card} accessibilityRole="button" accessibilityLabel={`${title}, posição ${rank}`}>
        <Text style={[styles.rank, { fontFamily: fonts.display }]}>{rank}</Text>
        <View style={styles.avatar}>
          {p?.avatar_url ? (
            <Image source={{ uri: p.avatar_url }} style={styles.avatarImg} contentFit="cover" />
          ) : (
            <View style={styles.avatarPh}>
              <Text style={[styles.avatarPhTxt, { fontFamily: fonts.bodySemi }]}>{initials}</Text>
            </View>
          )}
        </View>
        <View style={styles.mid}>
          <Text style={[styles.name, { fontFamily: fonts.bodySemi }]} numberOfLines={1}>
            {title}
          </Text>
          <Text style={[styles.leagueLine, { fontFamily: fonts.body }]} numberOfLines={1}>
            {leagueName.toUpperCase()}
          </Text>
          {item.abandoned ? (
            <Text style={styles.abandoned}>Abandonou</Text>
          ) : null}
        </View>
        <View style={styles.streakCol}>
          <Ionicons name="flash" size={16} color={colors.primary} />
          <Text style={[styles.streakNum, { fontFamily: fonts.bodySemi }]}>{streak}</Text>
        </View>
        <Text style={[styles.pts, { fontFamily: fonts.display }]}>
          {item.points_in_league.toLocaleString('pt-BR')}
        </Text>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCardAlt,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm + 2,
    gap: spacing.sm,
  },
  rank: {
    width: 22,
    fontSize: 18,
    color: colors.onSurface,
    textAlign: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radii.sm + 2,
    overflow: 'hidden',
    backgroundColor: colors.surfaceHigh,
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarPh: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPhTxt: { color: colors.onSurfaceVariant, fontSize: 13 },
  mid: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    color: colors.onSurface,
    fontSize: 15,
  },
  leagueLine: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
    letterSpacing: 0.4,
  },
  abandoned: {
    color: colors.secondary,
    fontSize: 10,
    marginTop: 2,
  },
  streakCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  streakNum: {
    color: colors.primary,
    fontSize: 14,
  },
  pts: {
    fontSize: 16,
    color: colors.onSurface,
    minWidth: 56,
    textAlign: 'right',
  },
});
