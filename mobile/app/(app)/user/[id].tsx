import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { colors, fonts, spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { fetchProfile, fetchUserPosts, isFollowing, toggleFollow } from '@/lib/api';
import type { PostWithAuthor, Profile } from '@/types/models';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Dimensions, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

const numColumns = 3;
const COL_GAP = 2;
const width = Dimensions.get('window').width - spacing.md * 2;
const cell = (width - COL_GAP * (numColumns - 1)) / numColumns;

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user: me } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const p = await fetchProfile(id);
    setProfile(p);
    setPosts(await fetchUserPosts(id));
    if (me?.id && me.id !== id) {
      setFollowing(await isFollowing(me.id, id));
    }
    setLoading(false);
  }, [id, me?.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function onFollow() {
    if (!me?.id || !id || me.id === id) return;
    await toggleFollow(me.id, id, following);
    setFollowing(!following);
  }

  if (loading || !profile) {
    return (
      <Screen>
        <ActivityIndicator color={colors.primary} />
      </Screen>
    );
  }

  const isSelf = me?.id === profile.id;

  const header = (
    <View style={styles.head}>
      <View style={styles.avatar}>
        {profile.avatar_url ? (
          <Image source={{ uri: profile.avatar_url }} style={styles.avatarImg} />
        ) : (
          <Ionicons name="person" size={40} color={colors.onSurfaceVariant} style={{ alignSelf: 'center', marginTop: 22 }} />
        )}
      </View>
      <Text style={[styles.name, { fontFamily: fonts.display }]}>{profile.display_name || profile.username}</Text>
      <Text style={[styles.user, { fontFamily: fonts.body }]}>@{profile.username}</Text>
      <View style={styles.stats}>
        <Text style={[styles.stat, { fontFamily: fonts.body }]}>
          <Text style={{ color: colors.primary, fontFamily: fonts.display }}>{profile.points}</Text> pts
        </Text>
        <Text style={[styles.stat, { fontFamily: fonts.body }]}>
          <Text style={{ color: colors.primary, fontFamily: fonts.display }}>{profile.streak_current}</Text> streak
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
      <Text style={[styles.gridTitle, { fontFamily: fonts.bodySemi }]}>Treinos</Text>
    </View>
  );

  return (
    <Screen padded={false}>
      <FlatList
        ListHeaderComponent={header}
        data={posts}
        numColumns={numColumns}
        keyExtractor={(item) => item.id}
        columnWrapperStyle={{ gap: COL_GAP, paddingHorizontal: spacing.md }}
        contentContainerStyle={{ paddingBottom: spacing.xxl, gap: COL_GAP }}
        ListEmptyComponent={
          <Text style={[styles.empty, { fontFamily: fonts.body }]}>Sem treinos públicos.</Text>
        }
        renderItem={({ item }) => (
          <Pressable
            style={{ width: cell, height: cell }}
            onPress={() => router.push(`/(app)/post/${item.id}`)}>
            <Image source={{ uri: item.image_url }} style={styles.thumb} contentFit="cover" />
          </Pressable>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: spacing.md, paddingTop: spacing.md },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.surfaceHigh,
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  name: { fontSize: 26, color: colors.onSurface, marginTop: spacing.md },
  user: { color: colors.onSurfaceVariant, marginTop: 4 },
  stats: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.md },
  stat: { color: colors.onSurfaceVariant },
  gridTitle: { marginTop: spacing.lg, marginBottom: spacing.sm, color: colors.onSurface },
  thumb: { width: '100%', height: '100%', borderRadius: 4, backgroundColor: colors.surfaceLowest },
  empty: { color: colors.onSurfaceVariant, paddingHorizontal: spacing.lg },
});
