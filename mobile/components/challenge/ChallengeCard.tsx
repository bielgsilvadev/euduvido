import { colors, fonts, radii, spacing, tintForId } from '@/constants/theme';
import { profileInitials } from '@/lib/format';
import type { ChallengeMeta, ChallengeWithCreator } from '@/types/models';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import type { Href } from 'expo-router';
import { Link } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { differenceInCalendarDays, formatDistanceToNow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type Props = {
  challenge: ChallengeWithCreator;
  onPressCheer?: () => void;
  onPressDoubt?: () => void;
  onPressComments?: () => void;
  /** Na página de detalhe não voltar a empilhar a mesma rota. */
  disableChallengeLink?: boolean;
};

function failureLabel(c: ChallengeWithCreator): string {
  const meta = (c.failure_destination_details as ChallengeMeta | null) ?? null;
  const payout = meta?.payout_destination;
  if (payout === 'developers' || c.failure_destination === 'developers') return 'Desenvolvedores';
  if (payout === 'winner' || c.failure_destination === 'rival') return 'Vencedor';
  const note = meta?.destination_label?.trim();
  if (note) return note;
  return 'Destino (legado)';
}

function duelLabel(c: ChallengeWithCreator): string {
  const meta = (c.failure_destination_details as ChallengeMeta | null) ?? null;
  const duel = meta?.duel;
  if (!duel || duel.mode === 'open') return 'Aposta aberta';
  const challenged = duel.challenged_username ? `@${duel.challenged_username}` : 'desafiado pendente';
  const arbiter = duel.arbiter_username ? `@${duel.arbiter_username}` : 'árbitro pendente';
  return `${challenged} • árbitro ${arbiter}`;
}

function progressPercent(c: ChallengeWithCreator): number {
  const start = parseISO(c.start_date).getTime();
  const end = parseISO(c.end_date).getTime();
  const now = Date.now();
  if (end <= start) return 0;
  const p = (now - start) / (end - start);
  return Math.min(100, Math.max(0, Math.round(p * 100)));
}

export function ChallengeCard({
  challenge: c,
  onPressCheer,
  onPressDoubt,
  onPressComments,
  disableChallengeLink,
}: Props) {
  const creator = c.creator;
  const initials = profileInitials(creator?.display_name ?? null, creator?.username ?? '?');
  const tint = tintForId(c.id);
  const daysLeft = Math.max(0, differenceInCalendarDays(parseISO(c.end_date), new Date()));
  const pct = progressPercent(c);
  const createdAgo = formatDistanceToNow(parseISO(c.created_at), { addSuffix: true, locale: ptBR });

  const cheerActive = c.my_reaction === 'cheer';
  const doubtActive = c.my_reaction === 'doubt';

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Link href={`/(app)/user/${c.creator_id}`} asChild>
          <Pressable style={styles.authorRow} accessibilityRole="link" accessibilityLabel={`Perfil ${creator?.username ?? ''}`}>
            {creator?.avatar_url ? (
              <Image source={{ uri: creator.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPh]}>
                <Text style={[styles.avatarTxt, { fontFamily: fonts.bodySemi }]}>{initials}</Text>
              </View>
            )}
            <View>
              <Text style={[styles.handle, { fontFamily: fonts.bodySemi }]} numberOfLines={1}>
                @{creator?.username ?? '—'}
              </Text>
              <Text style={[styles.time, { fontFamily: fonts.body }]}>{createdAgo}</Text>
            </View>
          </Pressable>
        </Link>
        <Pressable hitSlop={10} accessibilityLabel="Mais opções">
          <Ionicons name="ellipsis-horizontal" size={20} color={colors.textMuted} />
        </Pressable>
      </View>

      {disableChallengeLink ? (
        <View accessibilityLabel={`Desafio: ${c.title}`}>
          <Text style={[styles.title, { fontFamily: fonts.bodyBold }]} numberOfLines={2}>
            {c.title}
          </Text>
          <View style={[styles.coverWrap, { backgroundColor: tint }]}>
            {c.cover_image_url ? (
              <Image source={{ uri: c.cover_image_url }} style={styles.cover} contentFit="cover" />
            ) : (
              <View style={[styles.cover, styles.coverPh]}>
                <Ionicons name="flag-outline" size={40} color="rgba(255,255,255,0.35)" />
              </View>
            )}
            <View style={styles.catBadge}>
              <Text style={[styles.catTxt, { fontFamily: fonts.bodySemi }]}>{c.category}</Text>
            </View>
          </View>
          <View style={styles.betRow}>
            <Text style={[styles.betTxt, { fontFamily: fonts.body }]}>
              ⚔️ {duelLabel(c)}
            </Text>
            <Text style={[styles.betTxt, { fontFamily: fonts.body }]}>
              💰 {c.currency === 'BRL' ? 'R$' : c.currency} {Number(c.bet_amount).toFixed(0)} por lado → perdeu: {failureLabel(c)}
            </Text>
          </View>
          <View style={styles.countRow}>
            <Text style={[styles.countTxt, { fontFamily: fonts.body }, daysLeft < 2 && { color: colors.red }]}>
              ⏱️ {daysLeft} dia{daysLeft !== 1 ? 's' : ''} restante{daysLeft !== 1 ? 's' : ''}
            </Text>
            <Text style={[styles.pctTxt, { fontFamily: fonts.bodySemi }]}>{pct}%</Text>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${pct}%` }]} />
          </View>
        </View>
      ) : (
        <Link href={`/(app)/challenge/${c.id}` as Href} asChild>
          <Pressable accessibilityRole="button" accessibilityLabel={`Desafio: ${c.title}`}>
            <Text style={[styles.title, { fontFamily: fonts.bodyBold }]} numberOfLines={2}>
              {c.title}
            </Text>
            <View style={[styles.coverWrap, { backgroundColor: tint }]}>
              {c.cover_image_url ? (
                <Image source={{ uri: c.cover_image_url }} style={styles.cover} contentFit="cover" />
              ) : (
                <View style={[styles.cover, styles.coverPh]}>
                  <Ionicons name="flag-outline" size={40} color="rgba(255,255,255,0.35)" />
                </View>
              )}
              <View style={styles.catBadge}>
                <Text style={[styles.catTxt, { fontFamily: fonts.bodySemi }]}>{c.category}</Text>
              </View>
            </View>
            <View style={styles.betRow}>
              <Text style={[styles.betTxt, { fontFamily: fonts.body }]}>
                ⚔️ {duelLabel(c)}
              </Text>
              <Text style={[styles.betTxt, { fontFamily: fonts.body }]}>
                💰 {c.currency === 'BRL' ? 'R$' : c.currency} {Number(c.bet_amount).toFixed(0)} por lado → perdeu: {failureLabel(c)}
              </Text>
            </View>
            <View style={styles.countRow}>
              <Text style={[styles.countTxt, { fontFamily: fonts.body }, daysLeft < 2 && { color: colors.red }]}>
                ⏱️ {daysLeft} dia{daysLeft !== 1 ? 's' : ''} restante{daysLeft !== 1 ? 's' : ''}
              </Text>
              <Text style={[styles.pctTxt, { fontFamily: fonts.bodySemi }]}>{pct}%</Text>
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${pct}%` }]} />
            </View>
          </Pressable>
        </Link>
      )}

      <View style={styles.actions}>
        <Pressable
          style={[styles.actionBtn, cheerActive && styles.actionOnCheer]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onPressCheer?.();
          }}
          accessibilityLabel="Eu Acredito"
          accessibilityState={{ selected: cheerActive }}>
          <Text style={[styles.actionLbl, { fontFamily: fonts.bodySemi }, cheerActive && { color: colors.cheer }]}>
            🙌 Acredito {c.cheers_count}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.actionBtn, doubtActive && styles.actionOnDoubt]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onPressDoubt?.();
          }}
          accessibilityLabel="Eu Duvido"
          accessibilityState={{ selected: doubtActive }}>
          <Text style={[styles.actionLbl, { fontFamily: fonts.bodySemi }, doubtActive && { color: colors.doubt }]}>
            🤨 Duvido {c.doubters_count}
          </Text>
        </Pressable>
        <Pressable
          style={styles.actionBtn}
          onPress={onPressComments}
          accessibilityLabel="Comentários">
          <Text style={[styles.actionLbl, { fontFamily: fonts.bodySemi }]}>💬</Text>
        </Pressable>
      </View>
    </View>
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
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bgCardAlt },
  avatarPh: { alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { color: colors.accent, fontSize: 14 },
  handle: { color: colors.text, fontSize: 14 },
  time: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  title: { color: colors.text, fontSize: 17, lineHeight: 22, marginBottom: spacing.sm },
  coverWrap: {
    borderRadius: radii.md,
    overflow: 'hidden',
    aspectRatio: 16 / 9,
    marginBottom: spacing.sm,
  },
  cover: { width: '100%', height: '100%' },
  coverPh: { alignItems: 'center', justifyContent: 'center' },
  catBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.sm,
  },
  catTxt: { color: '#fff', fontSize: 11, textTransform: 'capitalize' },
  betRow: { marginBottom: 6 },
  betTxt: { color: colors.textSecondary, fontSize: 13 },
  countRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  countTxt: { color: colors.textSecondary, fontSize: 13 },
  pctTxt: { color: colors.accent, fontSize: 13 },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.bgCardAlt,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  fill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
  actions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radii.md,
    backgroundColor: colors.bgCardAlt,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionOnCheer: { borderColor: colors.cheer, backgroundColor: colors.accentGlow },
  actionOnDoubt: { borderColor: colors.doubt, backgroundColor: colors.goldDim },
  actionLbl: { color: colors.text, fontSize: 12 },
});
