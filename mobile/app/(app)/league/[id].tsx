import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { colors, fonts, spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import {
  fetchLeagueDetail,
  fetchLeagueLeaderboard,
  fetchLeagueMemberCounts,
  fetchLeaguePosts,
  isLeagueMember,
  joinLeague,
  toggleLike,
} from '@/lib/api';
import { PostCard } from '@/components/PostCard';
import type { LeagueMemberRow, LeagueRow, PostWithAuthor } from '@/types/models';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';

export default function LeagueDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [league, setLeague] = useState<LeagueRow | null>(null);
  const [board, setBoard] = useState<LeagueMemberRow[]>([]);
  const [member, setMember] = useState(false);
  const [count, setCount] = useState(0);
  const [feedPosts, setFeedPosts] = useState<PostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id || !user?.id) return;
    setLoading(true);
    const L = await fetchLeagueDetail(id);
    setLeague(L);
    if (L) {
      const c = await fetchLeagueMemberCounts([id]);
      setCount(c[id] ?? 0);
      setBoard(await fetchLeagueLeaderboard(id));
      setMember(await isLeagueMember(id, user.id));
      setFeedPosts(await fetchLeaguePosts(id, user.id));
    }
    setLoading(false);
  }, [id, user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function onJoin() {
    if (!user?.id || !league || !id) return;
    if (count >= league.max_participants) {
      Alert.alert('Liga cheia', 'Não há vagas disponíveis.');
      return;
    }
    const err = await joinLeague(id, user.id, league);
    if (err) {
      Alert.alert('Entrar na liga', err);
      return;
    }
    await load();
    Alert.alert('Você entrou na liga', 'Boa sorte no ranking.');
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

  if (loading || !league) {
    return (
      <Screen>
        <Text style={{ color: colors.onSurfaceVariant, fontFamily: fonts.body }}>Carregando…</Text>
      </Screen>
    );
  }

  const fee = (league.entry_fee_cents / 100).toFixed(2);

  const header = (
    <>
      <View style={styles.hero}>
        <Text style={[styles.title, { fontFamily: fonts.display }]}>{league.name}</Text>
        {league.description ? (
          <Text style={[styles.desc, { fontFamily: fonts.body }]}>{league.description}</Text>
        ) : null}
        <Text style={[styles.meta, { fontFamily: fonts.body }]}>
          {league.league_type === 'paid' ? `Entrada R$ ${fee} · ` : ''}
          {count}/{league.max_participants} atletas · {league.duration_days} dias
        </Text>
        {!member ? (
          <PrimaryButton title="Entrar na liga" onPress={onJoin} style={{ marginTop: spacing.md }} />
        ) : (
          <Text style={[styles.inLiga, { fontFamily: fonts.bodySemi }]}>Você está nesta liga</Text>
        )}
      </View>

      <Text style={[styles.section, { fontFamily: fonts.display }]}>Feed da liga</Text>
      <View style={{ paddingHorizontal: spacing.md }}>
        {feedPosts.length === 0 ? (
          <Text style={[styles.emptyFeed, { fontFamily: fonts.body }]}>Nenhum treino ligado a esta liga.</Text>
        ) : (
          feedPosts.map((p) => <PostCard key={p.id} post={p} onLike={() => onToggleLike(p)} />)
        )}
      </View>

      <Text style={[styles.section, { fontFamily: fonts.display }]}>Leaderboard</Text>
    </>
  );

  return (
    <Screen padded={false}>
      <FlatList
        ListHeaderComponent={header}
        data={board}
        keyExtractor={(item) => item.user_id}
        contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: spacing.xxl }}
        renderItem={({ item, index }) => (
          <View style={styles.row}>
            <Text style={[styles.rank, { fontFamily: fonts.display }]}>{index + 1}</Text>
            <View style={styles.av}>
              {item.profile?.avatar_url ? (
                <Image source={{ uri: item.profile.avatar_url }} style={styles.avImg} />
              ) : null}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.n, { fontFamily: fonts.bodySemi }]}>
                {item.profile?.display_name || item.profile?.username || '—'}
              </Text>
              {item.abandoned ? (
                <Text style={{ color: colors.secondary, fontSize: 11 }}>abandonou (mantém rank)</Text>
              ) : null}
            </View>
            <Text style={[styles.pts, { fontFamily: fonts.display }]}>{item.points_in_league}</Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={[styles.empty, { fontFamily: fonts.body }]}>Ninguém na liga ainda.</Text>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { padding: spacing.md },
  title: { fontSize: 28, color: colors.primary },
  desc: { color: colors.onSurfaceVariant, marginTop: spacing.sm, lineHeight: 22 },
  meta: { color: colors.onSurfaceVariant, marginTop: spacing.md },
  inLiga: { color: colors.primary, marginTop: spacing.md },
  section: { fontSize: 20, color: colors.onSurface, paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceHigh,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  rank: { width: 28, color: colors.tertiary, fontSize: 18 },
  av: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceLowest,
    overflow: 'hidden',
  },
  avImg: { width: '100%', height: '100%' },
  n: { color: colors.onSurface },
  pts: { fontSize: 18, color: colors.primary },
  empty: { color: colors.onSurfaceVariant, textAlign: 'center', padding: spacing.lg },
  emptyFeed: { color: colors.onSurfaceVariant, marginBottom: spacing.md },
});
