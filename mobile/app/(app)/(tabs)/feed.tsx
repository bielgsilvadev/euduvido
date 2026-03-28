import { AlertBanner } from '@/components/AlertBanner';
import { PostCard } from '@/components/PostCard';
import { Screen } from '@/components/ui/Screen';
import { colors, fonts, radii, spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { fetchGlobalFeed, fetchUserGlobalRank, toggleLike } from '@/lib/api';
import { profileInitials } from '@/lib/format';
import type { PostWithAuthor } from '@/types/models';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Link, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const LEVEL_NAMES = ['Novato', 'Guerreiro', 'Veterano', 'Elite', 'Lenda'];

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

const TAB_BAR_OFFSET = 96;

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, profile } = useAuth();
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [globalRank, setGlobalRank] = useState<number | null>(null);

  const load = useCallback(async () => {
    const data = await fetchGlobalFeed(user?.id);
    setPosts(data);
    if (user?.id) {
      setGlobalRank(await fetchUserGlobalRank(user.id));
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  async function onToggleLike(post: PostWithAuthor) {
    if (!user) return;
    const next = await toggleLike(post.id, user.id, !!post.liked_by_me);
    setPosts((prev) =>
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

  const levelName = useMemo(() => {
    const lv = profile?.level ?? 1;
    return LEVEL_NAMES[Math.min(Math.max(lv - 1, 0), LEVEL_NAMES.length - 1)];
  }, [profile?.level]);

  const nextLevelName = useMemo(() => {
    const lv = profile?.level ?? 1;
    return LEVEL_NAMES[Math.min(lv, LEVEL_NAMES.length - 1)];
  }, [profile?.level]);

  const progressInLevel = useMemo(() => {
    const pts = profile?.points ?? 0;
    return (pts % 50) / 50;
  }, [profile?.points]);

  const ptsInSegment = Math.round(progressInLevel * 50);

  const initials = profile
    ? profileInitials(profile.display_name, profile.username)
    : 'DL';

  const listHeader = (
    <View style={{ paddingTop: Math.max(insets.top, 12) }}>
      <View style={styles.topRow}>
        <View>
          <View style={styles.greetRow}>
            <Text style={[styles.greet, { fontFamily: fonts.body }]}>{greeting()}</Text>
            <Ionicons name="barbell-outline" size={14} color={colors.accent} style={{ marginLeft: 4 }} />
          </View>
          <Text style={[styles.brand, { fontFamily: fonts.display }]}>DRYLEAGUE</Text>
        </View>
        <View style={styles.topActions}>
          <Pressable accessibilityLabel="Notificações" style={styles.bellWrap} hitSlop={12}>
            <Ionicons name="notifications-outline" size={22} color={colors.textMuted} />
            <View style={styles.notifDot} />
          </Pressable>
          <Link href="/(app)/(tabs)/profile" asChild>
            <Pressable accessibilityLabel="Meu perfil">
              {profile?.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={styles.headerAvatar} />
              ) : (
                <View style={[styles.headerAvatar, styles.headerAvatarPh]}>
                  <Text style={[styles.headerAvatarTxt, { fontFamily: fonts.bodySemi }]}>{initials}</Text>
                </View>
              )}
            </Pressable>
          </Link>
        </View>
      </View>

      <View style={{ paddingHorizontal: spacing.md }}>
        <AlertBanner
          title="Não treine hoje = -2 pts"
          subtitle="Mantenha o streak e suba no ranking das ligas."
        />
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={[styles.statVal, { fontFamily: fonts.display, color: colors.accent }]}>
            {profile?.points ?? 0}
          </Text>
          <Text style={[styles.statLbl, { fontFamily: fonts.body }]}>PONTOS</Text>
        </View>
        <View style={styles.statCard}>
          <View style={styles.streakInner}>
            <Ionicons name="flame" size={20} color="#FF6B35" />
            <Text style={[styles.statVal, { fontFamily: fonts.display, color: '#FF6B35' }]}>
              {profile?.streak_current ?? 0}
            </Text>
          </View>
          <Text style={[styles.statLbl, { fontFamily: fonts.body }]}>STREAK</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statVal, { fontFamily: fonts.display, color: colors.gold }]}>
            {globalRank != null ? `#${globalRank}` : '—'}
          </Text>
          <Text style={[styles.statLbl, { fontFamily: fonts.body }]}>RANKING</Text>
        </View>
      </View>

      <View style={styles.levelCard}>
        <View style={styles.levelRow}>
          <Text style={[styles.levelTitle, { fontFamily: fonts.bodySemi }]}>
            Nível {profile?.level ?? 1} — {levelName}
          </Text>
          <Text style={[styles.levelPts, { fontFamily: fonts.bodySemi }]}>
            {ptsInSegment}/50 pts
          </Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.min(100, progressInLevel * 100)}%` }]} />
        </View>
        <Text style={[styles.nextLvl, { fontFamily: fonts.body }]}>Próximo nível: {nextLevelName}</Text>
      </View>

      <Pressable
        style={({ pressed }) => [styles.cta, pressed && { opacity: 0.92 }]}
        onPress={() => router.push('/(app)/(tabs)/post')}
        accessibilityRole="button"
        accessibilityLabel="Registrar treino hoje">
        <Ionicons name="camera-outline" size={18} color="#000" />
        <Text style={[styles.ctaTxt, { fontFamily: fonts.bodySemi }]}>Registrar Treino Hoje</Text>
      </Pressable>

      <View style={styles.feedTitleRow}>
        <Text style={[styles.feedTitle, { fontFamily: fonts.bodySemi }]}>FEED GLOBAL</Text>
      </View>
    </View>
  );

  return (
    <Screen padded={false} edges={['top']}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={listHeader}
        contentContainerStyle={{
          paddingBottom: insets.bottom + TAB_BAR_OFFSET,
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
        ListEmptyComponent={
          <Text style={[styles.empty, { fontFamily: fonts.body }]}>
            Nenhum treino público ainda. Publique o seu na aba Treinar.
          </Text>
        }
        renderItem={({ item }) => (
          <PostCard post={item} viewerId={user?.id} onLike={() => onToggleLike(item)} />
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    marginBottom: 20,
  },
  greetRow: { flexDirection: 'row', alignItems: 'center' },
  greet: { fontSize: 13, color: colors.textMuted, marginBottom: 2 },
  brand: { fontSize: 28, lineHeight: 30, color: colors.text, letterSpacing: 1 },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bellWrap: { position: 'relative' },
  notifDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.red,
    borderWidth: 2,
    borderColor: colors.bg,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bgCardAlt,
  },
  headerAvatarPh: { alignItems: 'center', justifyContent: 'center' },
  headerAvatarTxt: { fontSize: 12, color: colors.accent },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: spacing.md,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    paddingVertical: 14,
    alignItems: 'center',
  },
  streakInner: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statVal: { fontSize: 32, lineHeight: 36 },
  statLbl: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
  levelCard: {
    marginHorizontal: spacing.md,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: 20,
  },
  levelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  levelTitle: { fontSize: 13, color: colors.text },
  levelPts: { fontSize: 13, color: colors.accent },
  progressTrack: {
    height: 6,
    backgroundColor: colors.bgCardAlt,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
  nextLvl: { fontSize: 11, color: colors.textMuted, marginTop: 6 },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.accent,
    marginHorizontal: spacing.md,
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 20,
  },
  ctaTxt: { fontSize: 15, fontWeight: '600', color: '#000' },
  feedTitleRow: { paddingHorizontal: spacing.md, marginBottom: 16 },
  feedTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: 1.2,
  },
  empty: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
});
