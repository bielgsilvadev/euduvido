import { LoadingLogo } from '@/components/ui/LoadingLogo';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { colors, fonts, screenPaddingX, spacing, tintForId } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { fetchFollowCounts, fetchProfile, isFollowing, toggleFollow } from '@/lib/api';
import { fetchUserChallenges } from '@/lib/challengesApi';
import { BETS_PER_LEVEL } from '@/lib/userLevel';
import type { ChallengeWithCreator, Profile } from '@/types/models';
import { Image } from 'expo-image';
import type { Href } from 'expo-router';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { Dimensions, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const numColumns = 3;
const COL_GAP = 2;
const width = Dimensions.get('window').width - screenPaddingX * 2;
const cell = (width - COL_GAP * (numColumns - 1)) / numColumns;

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user: me } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [challenges, setChallenges] = useState<ChallengeWithCreator[]>([]);
  const [following, setFollowing] = useState(false);
  const [counts, setCounts] = useState({ followers: 0, following: 0 });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const p = await fetchProfile(id);
    setProfile(p);
    setChallenges(await fetchUserChallenges(id));
    setCounts(await fetchFollowCounts(id));
    if (me?.id && me.id !== id) {
      setFollowing(await isFollowing(me.id, id));
    }
    setLoading(false);
  }, [id, me?.id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function onFollow() {
    if (!me?.id || !id || me.id === id) return;
    await toggleFollow(me.id, id, following);
    setFollowing(!following);
    setCounts(await fetchFollowCounts(id));
  }

  if (loading || !profile) {
    return (
      <Screen padded={false}>
        <View style={styles.loadingWrap}>
          <LoadingLogo />
        </View>
      </Screen>
    );
  }

  const isSelf = me?.id === profile.id;
  const reputation = profile.reputation_score ?? profile.points;
  const duelsCreated = profile.total_challenges_created ?? challenges.length;

  const header = (
    <View style={styles.head}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="Voltar">
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </Pressable>
      </View>
      <View style={styles.avatar}>
        {profile.avatar_url ? (
          <Image source={{ uri: profile.avatar_url }} style={styles.avatarImg} />
        ) : (
          <Ionicons name="person" size={40} color={colors.onSurfaceVariant} style={{ alignSelf: 'center', marginTop: 22 }} />
        )}
      </View>
      <Text style={[styles.name, { fontFamily: fonts.display }]}>{profile.display_name || profile.username}</Text>
      <Text style={[styles.user, { fontFamily: fonts.body }]}>@{profile.username}</Text>

      <View style={styles.countsRow}>
        <Link href={`/(app)/user/${id}/followers`} asChild>
          <Pressable style={styles.countTap} accessibilityRole="button" accessibilityLabel="Ver seguidores">
            <Text style={[styles.countNum, { fontFamily: fonts.display }]}>{counts.followers}</Text>
            <Text style={[styles.countLbl, { fontFamily: fonts.body }]}>seguidores</Text>
          </Pressable>
        </Link>
        <View style={styles.countDivider} />
        <Link href={`/(app)/user/${id}/following`} asChild>
          <Pressable style={styles.countTap} accessibilityRole="button" accessibilityLabel="Ver seguindo">
            <Text style={[styles.countNum, { fontFamily: fonts.display }]}>{counts.following}</Text>
            <Text style={[styles.countLbl, { fontFamily: fonts.body }]}>seguindo</Text>
          </Pressable>
        </Link>
        <View style={styles.countDivider} />
        <View style={styles.countTap}>
          <Text style={[styles.countNum, { fontFamily: fonts.display }]}>{challenges.length}</Text>
          <Text style={[styles.countLbl, { fontFamily: fonts.body }]}>desafios</Text>
        </View>
      </View>

      {profile.bio ? (
        <Text style={[styles.bio, { fontFamily: fonts.body }]}>{profile.bio}</Text>
      ) : null}

      <View style={styles.stats}>
        <Text style={[styles.stat, { fontFamily: fonts.body }]}>
          <Text style={{ color: colors.gold, fontFamily: fonts.display }}>Nv. {profile.level}</Text>
          {' · '}
          <Text style={{ color: colors.textMuted }}>a cada {BETS_PER_LEVEL} apostas</Text>
        </Text>
      </View>
      <View style={styles.stats}>
        <Text style={[styles.stat, { fontFamily: fonts.body }]}>
          <Text style={{ color: colors.accent, fontFamily: fonts.display }}>{reputation}</Text> reputação
        </Text>
        <Text style={[styles.stat, { fontFamily: fonts.body }]}>
          <Text style={{ color: colors.accent, fontFamily: fonts.display }}>{duelsCreated}</Text> apostas criadas
        </Text>
      </View>
      {!isSelf && me ? (
        <PrimaryButton
          title={following ? 'Deixar de seguir' : 'Seguir'}
          onPress={onFollow}
          variant={following ? 'ghost' : 'primary'}
          style={{ marginTop: spacing.md }}
        />
      ) : null}
      <Text style={[styles.gridTitle, { fontFamily: fonts.bodySemi }]}>Desafios</Text>
    </View>
  );

  return (
    <Screen padded={false}>
      <FlatList
        ListHeaderComponent={header}
        data={challenges}
        numColumns={numColumns}
        keyExtractor={(item) => item.id}
        columnWrapperStyle={{ gap: COL_GAP, paddingHorizontal: screenPaddingX }}
        contentContainerStyle={{ paddingBottom: spacing.xxl, gap: COL_GAP }}
        ListEmptyComponent={
          <Text style={[styles.empty, { fontFamily: fonts.body }]}>Nenhum desafio público ainda.</Text>
        }
        renderItem={({ item }) => (
          <Pressable
            style={{ width: cell, height: cell }}
            onPress={() => router.push(`/(app)/challenge/${item.id}` as Href)}
            accessibilityLabel={`Desafio ${item.title}`}>
            {item.cover_image_url ? (
              <Image source={{ uri: item.cover_image_url }} style={styles.thumb} contentFit="cover" />
            ) : (
              <View style={[styles.thumb, { backgroundColor: tintForId(item.id), alignItems: 'center', justifyContent: 'center' }]}>
                <Ionicons name="flag" size={22} color="rgba(255,255,255,0.4)" />
              </View>
            )}
          </Pressable>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  head: { paddingHorizontal: screenPaddingX },
  topBar: { marginBottom: 8, marginTop: 4 },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.surfaceHigh,
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  name: { fontSize: 26, color: colors.text, marginTop: spacing.md },
  user: { color: colors.textMuted, marginTop: 4 },
  countsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
  },
  countTap: { alignItems: 'center', minWidth: 72 },
  countNum: { fontSize: 20, color: colors.text },
  countLbl: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  countDivider: { width: 1, height: 28, backgroundColor: colors.border },
  bio: { color: colors.textMuted, marginTop: spacing.md, lineHeight: 20 },
  stats: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.md },
  stat: { color: colors.textMuted },
  gridTitle: { marginTop: spacing.lg, marginBottom: spacing.sm, color: colors.text },
  thumb: { width: '100%', height: '100%', borderRadius: 4, backgroundColor: colors.bgCardAlt },
  empty: { color: colors.textMuted, paddingHorizontal: screenPaddingX },
});
