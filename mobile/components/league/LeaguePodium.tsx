import { colors, fonts, radii, spacing } from '@/constants/theme';
import { profileInitials } from '@/lib/format';
import type { LeagueMemberRow } from '@/types/models';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const MEDAL = {
  1: { border: '#E6B800' },
  2: { border: '#B8BCC4' },
  3: { border: '#B87333' },
} as const;

function PodiumFace({
  place,
  member,
  tall,
}: {
  place: 1 | 2 | 3;
  member: LeagueMemberRow | undefined;
  tall: boolean;
}) {
  const m = MEDAL[place];
  const p = member?.profile;
  const name = (p?.display_name || p?.username || '—').toUpperCase();
  const initials = p ? profileInitials(p.display_name, p.username) : '—';
  const borderColor = member ? m.border : colors.border;

  const card = (
    <View
      style={[
        styles.podiumCard,
        tall && styles.podiumCardTall,
        { borderColor, shadowColor: member ? m.border : colors.background },
      ]}>
      {place === 1 && member ? (
        <View style={styles.crownWrap}>
          <Ionicons name="star" size={14} color={m.border} />
        </View>
      ) : null}
      <View style={[styles.avatarRing, { borderColor }]}>
        {p?.avatar_url ? (
          <Image source={{ uri: p.avatar_url }} style={styles.avatarImg} contentFit="cover" />
        ) : (
          <View style={styles.avatarPh}>
            <Text style={[styles.avatarPhTxt, { fontFamily: fonts.bodySemi }]}>{initials}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.podiumName, { fontFamily: fonts.bodySemi }]} numberOfLines={2}>
        {member ? name : '—'}
      </Text>
      {member ? (
        <Text style={[styles.podiumPts, { fontFamily: fonts.display }]}>
          {member.points_in_league.toLocaleString('pt-BR')} pts
        </Text>
      ) : (
        <Text style={[styles.podiumPts, { fontFamily: fonts.body, color: colors.textDim }]}>—</Text>
      )}
    </View>
  );

  if (member) {
    return (
      <View style={[styles.slot, tall ? styles.slotTall : styles.slotShort]}>
        <Link href={`/(app)/user/${member.user_id}`} asChild>
          <Pressable accessibilityRole="button" accessibilityLabel={`Perfil ${name}`}>
            {card}
          </Pressable>
        </Link>
      </View>
    );
  }

  return <View style={[styles.slot, tall ? styles.slotTall : styles.slotShort]}>{card}</View>;
}

type Props = {
  board: LeagueMemberRow[];
};

/** Pódio 2º – 1º – 3º (ouro ao centro, mais alto). */
export function LeaguePodium({ board }: Props) {
  const first = board[0];
  const second = board[1];
  const third = board[2];
  if (!first) {
    return (
      <View style={styles.emptyPodium}>
        <Text style={[styles.emptyPodiumTxt, { fontFamily: fonts.body }]}>Ainda sem classificação nesta liga.</Text>
      </View>
    );
  }

  return (
    <View style={styles.podiumRow}>
      <PodiumFace place={2} member={second} tall={false} />
      <PodiumFace place={1} member={first} tall />
      <PodiumFace place={3} member={third} tall={false} />
    </View>
  );
}

const styles = StyleSheet.create({
  podiumRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.lg,
  },
  slot: {
    flex: 1,
    maxWidth: 120,
  },
  slotTall: {
    maxWidth: 130,
  },
  slotShort: {
    marginBottom: spacing.sm,
  },
  podiumCard: {
    backgroundColor: colors.bgCardAlt,
    borderRadius: radii.lg,
    borderWidth: 2,
    padding: spacing.sm,
    paddingTop: spacing.md,
    alignItems: 'center',
    minHeight: 138,
    justifyContent: 'flex-end',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  podiumCardTall: {
    minHeight: 168,
    paddingTop: spacing.lg,
  },
  crownWrap: {
    position: 'absolute',
    top: 6,
    alignSelf: 'center',
  },
  avatarRing: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 2,
    overflow: 'hidden',
    marginBottom: spacing.xs,
    backgroundColor: colors.surfaceLowest,
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarPh: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceHigh,
  },
  avatarPhTxt: { color: colors.onSurfaceVariant, fontSize: 14 },
  podiumName: {
    color: colors.primary,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 14,
    minHeight: 28,
  },
  podiumPts: {
    color: colors.onSurface,
    fontSize: 13,
    marginTop: 4,
  },
  emptyPodium: {
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  emptyPodiumTxt: { color: colors.textMuted, textAlign: 'center' },
});
