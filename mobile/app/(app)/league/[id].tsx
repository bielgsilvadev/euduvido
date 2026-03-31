import { LeaguePodium } from '@/components/league/LeaguePodium';
import { LeagueRankingRow } from '@/components/league/LeagueRankingRow';
import { PostCard } from '@/components/PostCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { LoadingLogo } from '@/components/ui/LoadingLogo';
import { Screen } from '@/components/ui/Screen';
import { TabSegment } from '@/components/ui/TabSegment';
import { colors, fonts, formTextInputStyle, radii, screenPaddingX, spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import {
  fetchLeagueDetail,
  fetchLeagueLeaderboard,
  fetchLeagueMemberCounts,
  fetchLeaguePosts,
  isLeagueMember,
  joinLeague,
  leaveLeagueMembership,
  toggleLike,
  updateLeagueByCreator,
} from '@/lib/api';
import { notifyError } from '@/lib/notify';
import type { LeagueMemberRow, LeagueRow, PostWithAuthor } from '@/types/models';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Folga extra para o bloco «Sair da comunidade» no fim da lista. */
const LEAVE_FOOTER_SPACE = 88;

type DetailTab = 'ranking' | 'feed';

export default function LeagueDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [league, setLeague] = useState<LeagueRow | null>(null);
  const [board, setBoard] = useState<LeagueMemberRow[]>([]);
  const [member, setMember] = useState(false);
  const [count, setCount] = useState(0);
  const [feedPosts, setFeedPosts] = useState<PostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [detailTab, setDetailTab] = useState<DetailTab>('ranking');
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const load = useCallback(async () => {
    if (!id) {
      setLeague(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const L = await fetchLeagueDetail(id);
      setLeague(L);
      if (!L) {
        setBoard([]);
        setCount(0);
        setMember(false);
        setFeedPosts([]);
        return;
      }
      const c = await fetchLeagueMemberCounts([id]);
      setCount(c[id] ?? 0);
      const fullBoard = await fetchLeagueLeaderboard(id);
      setBoard(fullBoard);
      const uid = user?.id;
      if (uid) {
        setMember(await isLeagueMember(id, uid));
        setFeedPosts(await fetchLeaguePosts(id, uid));
      } else {
        setMember(false);
        setFeedPosts([]);
      }
    } finally {
      setLoading(false);
    }
  }, [id, user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const rankingRest = useMemo(() => board.slice(3), [board]);

  async function onJoin() {
    if (!user?.id || !league || !id) {
      notifyError('Inicia sessão para entrar na comunidade.', 'Sessão');
      return;
    }
    if (count >= league.max_participants) {
      Alert.alert('Comunidade cheia', 'Não há vagas disponíveis.');
      return;
    }
    const err = await joinLeague(id, user.id, league);
    if (err) {
      Alert.alert('Entrar na comunidade', err);
      return;
    }
    await load();
    Alert.alert('Você entrou', 'Agora acompanhe e participe dos duelos do grupo.');
  }

  function onLeavePress() {
    if (!user?.id || !id || !league) return;
    Alert.alert('Sair da comunidade', 'Você deixará este grupo e o ranking interno.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          const err = await leaveLeagueMembership(id, user.id);
          if (err) {
          notifyError(err, 'Sair da comunidade');
            return;
          }
          router.back();
        },
      },
    ]);
  }

  async function onShare() {
    if (!league) return;
    try {
      await Share.share({
        title: league.name,
        message: `Liga no Eu Duvido!: ${league.name}${league.description ? `\n\n${league.description}` : ''}`,
      });
    } catch {
      /* cancel */
    }
  }

  function openEdit() {
    if (!league) return;
    setEditName(league.name);
    setEditDesc(league.description ?? '');
    setEditOpen(true);
  }

  async function saveEdit() {
    if (!user?.id || !id || !league) return;
    const n = editName.trim();
    if (!n) {
      notifyError('O nome não pode ficar vazio.', 'Editar comunidade');
      return;
    }
    setSavingEdit(true);
    try {
      const err = await updateLeagueByCreator(id, user.id, { name: n, description: editDesc.trim() || null });
      if (err) {
        notifyError(err, 'Editar comunidade');
        return;
      }
      setEditOpen(false);
      await load();
    } finally {
      setSavingEdit(false);
    }
  }

  async function onToggleLike(post: PostWithAuthor) {
    if (!user) return;
    const next = await toggleLike(post.id, user.id, !!post.liked_by_me);
    setFeedPosts((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? {
              ...p,
              liked_by_me: next,
              like_count: Math.max(0, (p.like_count ?? 0) + (next ? 1 : -1)),
            }
          : p,
      ),
    );
  }

  if (!id) {
    return (
      <Screen>
        <Text style={[styles.missTxt, { fontFamily: fonts.body }]}>Identificador da comunidade em falta.</Text>
        <PrimaryButton title="Voltar" onPress={() => router.back()} style={{ marginTop: spacing.md }} />
      </Screen>
    );
  }

  if (loading) {
    return (
      <Screen>
        <View style={styles.loadingWrap}>
          <LoadingLogo />
          <Text style={[styles.loadingTxt, { fontFamily: fonts.body }]}>A carregar…</Text>
        </View>
      </Screen>
    );
  }

  if (!league) {
    return (
      <Screen>
        <Text style={[styles.missTxt, { fontFamily: fonts.body }]}>
          Liga não encontrada ou sem permissão para ver.
        </Text>
        <PrimaryButton title="Voltar" onPress={() => router.back()} style={{ marginTop: spacing.md }} />
      </Screen>
    );
  }

  const fee = (league.entry_fee_cents / 100).toFixed(2);
  const isCreator = Boolean(user?.id && league.creator_id === user.id);

  const listPadBottomRanking = member
    ? LEAVE_FOOTER_SPACE + insets.bottom + spacing.xxl
    : insets.bottom + spacing.xxl;

  const listPadBottomFeed = member ? LEAVE_FOOTER_SPACE + insets.bottom + spacing.xxl : insets.bottom + spacing.xxl;

  const headerCommon = (
    <>
      <View style={styles.topBar}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Voltar">
          <Ionicons name="chevron-back" size={28} color={colors.onSurface} />
        </Pressable>
        <View style={styles.topBarActions}>
          <Pressable onPress={onShare} hitSlop={10} accessibilityRole="button" accessibilityLabel="Partilhar comunidade">
            <Ionicons name="share-outline" size={22} color={colors.primary} />
          </Pressable>
          {isCreator ? (
            <Pressable onPress={openEdit} hitSlop={10} accessibilityRole="button" accessibilityLabel="Editar comunidade">
              <Ionicons name="create-outline" size={22} color={colors.primary} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={styles.hero}>
        <Text style={[styles.heroTitle, { fontFamily: fonts.display }]}>{league.name.toUpperCase()}</Text>
        {league.description ? (
          <Text style={[styles.heroDesc, { fontFamily: fonts.body }]} numberOfLines={2}>
            {league.description}
          </Text>
        ) : null}
        <Text style={[styles.heroMeta, { fontFamily: fonts.body }]}>
          {league.league_type === 'paid' ? `Entrada R$ ${fee} · ` : ''}
          {count}/{league.max_participants} membros · {league.duration_days} dias
        </Text>
        {league.status !== 'active' ? (
          <Text style={[styles.statusOff, { fontFamily: fonts.bodySemi }]}>
            {league.status === 'ended' ? 'Terminada' : league.status === 'draft' ? 'Rascunho' : league.status}
          </Text>
        ) : null}
        {!member ? (
          <PrimaryButton title="Entrar na comunidade" onPress={onJoin} style={{ marginTop: spacing.md }} />
        ) : (
          <Text style={[styles.inLiga, { fontFamily: fonts.bodySemi }]}>Você participa desta comunidade</Text>
        )}
      </View>

      <View style={styles.tabWrap}>
        <TabSegment
          tabs={[
            { key: 'ranking', label: 'Ranking' },
            { key: 'feed', label: 'Feed' },
          ]}
          active={detailTab}
          onChange={(k) => setDetailTab(k as DetailTab)}
        />
      </View>
    </>
  );

  const rankingHeader = (
    <>
      {headerCommon}
      <LeaguePodium board={board} />
      <Text style={[styles.sectionTitle, { fontFamily: fonts.display }]}>Classificação</Text>
    </>
  );

  const feedHeader = (
    <>
      {headerCommon}
      <Text style={[styles.sectionTitle, { fontFamily: fonts.display }]}>Atividade da comunidade</Text>
    </>
  );

  const leaveFooter = member ? (
    <View style={styles.leaveSection}>
      <View style={styles.leaveDivider} />
      <Pressable
        onPress={onLeavePress}
        style={styles.leaveSectionBtn}
        accessibilityRole="button"
        accessibilityLabel="Sair da comunidade">
        <Ionicons name="exit-outline" size={22} color={colors.secondary} />
        <Text style={[styles.leaveSectionTxt, { fontFamily: fonts.bodySemi }]}>Sair da comunidade</Text>
      </Pressable>
      <Text style={[styles.leaveSectionHint, { fontFamily: fonts.body }]}>
        Você deixa de aparecer nesta comunidade e no ranking interno.
      </Text>
    </View>
  ) : null;

  return (
    <View style={styles.root}>
      <Screen padded={false} edges={['top']}>
        {detailTab === 'ranking' ? (
          <FlatList
            data={rankingRest}
            keyExtractor={(item) => item.user_id}
            ListHeaderComponent={rankingHeader}
            contentContainerStyle={[styles.listContent, { paddingBottom: listPadBottomRanking }]}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
            }
            renderItem={({ item, index }) => (
              <LeagueRankingRow rank={index + 4} item={item} leagueName={league.name} />
            )}
            ListFooterComponent={leaveFooter}
            ListEmptyComponent={
              board.length > 3 ? null : (
                <Text style={[styles.emptyList, { fontFamily: fonts.body }]}>
                  {board.length === 0
                    ? 'Ainda não há membros no ranking.'
                    : 'Todos os membros estão no pódio — convide mais gente!'}
                </Text>
              )
            }
          />
        ) : (
          <FlatList
            data={feedPosts}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={feedHeader}
            contentContainerStyle={[styles.listContent, { paddingBottom: listPadBottomFeed }]}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
            }
            renderItem={({ item }) => (
              <PostCard post={item} viewerId={user?.id} onLike={() => onToggleLike(item)} />
            )}
            ListFooterComponent={leaveFooter}
            ListEmptyComponent={
              <Text style={[styles.emptyList, { fontFamily: fonts.body }]}>
                Nenhuma publicação visível nesta comunidade. Poste com audiência «Liga» para aparecer aqui.
              </Text>
            }
          />
        )}
      </Screen>

      <Modal visible={editOpen} animationType="slide" transparent onRequestClose={() => setEditOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setEditOpen(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={[styles.modalTitle, { fontFamily: fonts.display }]}>Editar comunidade</Text>
            <Text style={[styles.modalHint, { fontFamily: fonts.body }]}>
              Só nome e descrição. Duração, vagas e regras ficam fixas após a criação.
            </Text>
            <Text style={[styles.modalLabel, { fontFamily: fonts.bodySemi }]}>Nome</Text>
            <TextInput
              value={editName}
              onChangeText={setEditName}
              placeholder="Nome da comunidade"
              placeholderTextColor={colors.onSurfaceVariant}
              style={[formTextInputStyle, { fontFamily: fonts.body }]}
            />
            <Text style={[styles.modalLabel, { fontFamily: fonts.bodySemi }]}>Descrição</Text>
            <TextInput
              value={editDesc}
              onChangeText={setEditDesc}
              placeholder="Opcional"
              placeholderTextColor={colors.onSurfaceVariant}
              multiline
              style={[formTextInputStyle, styles.area, { fontFamily: fonts.body }]}
            />
            <View style={styles.modalBtns}>
              <PrimaryButton title="Cancelar" variant="ghost" onPress={() => setEditOpen(false)} style={{ flex: 1 }} />
              <PrimaryButton
                title="Guardar"
                onPress={saveEdit}
                loading={savingEdit}
                style={{ flex: 1, marginLeft: spacing.sm }}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  loadingTxt: { color: colors.primary },
  listContent: {
    paddingHorizontal: screenPaddingX,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: screenPaddingX,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  topBarActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  hero: { paddingHorizontal: screenPaddingX, paddingBottom: spacing.md },
  heroTitle: { fontSize: 26, color: colors.primary, letterSpacing: 1 },
  heroDesc: { color: colors.textMuted, marginTop: spacing.sm, lineHeight: 20, fontSize: 14 },
  heroMeta: { color: colors.onSurfaceVariant, marginTop: spacing.md, fontSize: 13 },
  statusOff: { color: colors.tertiary, marginTop: spacing.sm },
  inLiga: { color: colors.primary, marginTop: spacing.md },
  leaveSection: {
    marginTop: spacing.xl,
    paddingBottom: spacing.sm,
  },
  leaveDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderLight,
    marginBottom: spacing.lg,
  },
  leaveSectionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.secondary,
    backgroundColor: colors.redDim,
  },
  leaveSectionTxt: { color: colors.secondary, fontSize: 15 },
  leaveSectionHint: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 17,
    paddingHorizontal: spacing.sm,
  },
  tabWrap: { paddingHorizontal: screenPaddingX, marginBottom: spacing.md },
  sectionTitle: { fontSize: 18, color: colors.onSurface, marginBottom: spacing.sm, letterSpacing: 0.5 },
  emptyList: { color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.lg, paddingHorizontal: spacing.md },
  missTxt: { color: colors.onSurfaceVariant, textAlign: 'center', paddingHorizontal: spacing.lg },
  modalBackdrop: {
    flex: 1,
    backgroundColor: colors.scrim,
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.surfaceHigh,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  modalTitle: { fontSize: 22, color: colors.primary, marginBottom: spacing.sm },
  modalHint: { color: colors.onSurfaceVariant, marginBottom: spacing.md, lineHeight: 20 },
  modalLabel: { color: colors.onSurface, marginTop: spacing.sm, marginBottom: spacing.xs },
  area: { minHeight: 88, textAlignVertical: 'top' },
  modalBtns: { flexDirection: 'row', marginTop: spacing.lg },
});
