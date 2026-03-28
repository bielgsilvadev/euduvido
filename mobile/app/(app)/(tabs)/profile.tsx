import { Pill } from '@/components/ui/Pill';
import { Screen } from '@/components/ui/Screen';
import { colors, fonts, radii, spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { fetchUserPosts } from '@/lib/api';
import { profileInitials } from '@/lib/format';
import type { PostWithAuthor } from '@/types/models';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { Dimensions, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const COL_GAP = 2;
const numColumns = 3;
const width = Dimensions.get('window').width - spacing.md * 2;
const cell = (width - COL_GAP * (numColumns - 1)) / numColumns;
const TAB_BAR_OFFSET = 96;

const BADGE_ROW = [
  { icon: 'flame-outline' as const, name: 'Streak 7d', color: '#FF6B35', earned: true },
  { icon: 'barbell-outline' as const, name: '1º Treino', color: colors.accent, earned: true },
  { icon: 'flash-outline' as const, name: 'Streak 30d', color: colors.gold, earned: true },
  { icon: 'trophy-outline' as const, name: 'Liga', color: colors.gold, earned: true },
  { icon: 'moon-outline' as const, name: 'Madrugador', color: colors.purple, earned: false },
  { icon: 'analytics-outline' as const, name: '100 pts', color: colors.blue, earned: true },
  { icon: 'shield-checkmark-outline' as const, name: 'Disciplina', color: colors.accent, earned: true },
  { icon: 'ribbon-outline' as const, name: 'Top 1', color: colors.gold, earned: false },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { profile, user } = useAuth();
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);

  const load = useCallback(async () => {
    if (user?.id) setPosts(await fetchUserPosts(user.id));
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (!profile || !user) return null;

  const initials = profileInitials(profile.display_name, profile.username);

  const header = (
    <View style={{ paddingTop: Math.max(insets.top, 12) }}>
      <View style={styles.headTop}>
        <Text style={[styles.brand, { fontFamily: fonts.display }]}>PERFIL</Text>
        <Link href="/(app)/settings" asChild>
          <Pressable accessibilityLabel="Ajustes" hitSlop={12}>
            <Ionicons name="settings-outline" size={22} color={colors.textMuted} />
          </Pressable>
        </Link>
      </View>

      <View style={styles.profileRow}>
        <View>
          <View style={styles.bigAvatarWrap}>
            {profile.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.bigAvatar} />
            ) : (
              <View style={[styles.bigAvatar, styles.bigAvatarPh]}>
                <Text style={[styles.bigAvatarTxt, { fontFamily: fonts.display }]}>{initials}</Text>
              </View>
            )}
            <View style={styles.verified}>
              <Ionicons name="checkmark" size={12} color="#000" />
            </View>
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.displayName, { fontFamily: fonts.bodyBold }]}>{profile.display_name || profile.username}</Text>
          <Text style={[styles.handle, { fontFamily: fonts.body }]}>@{profile.username}</Text>
          <View style={styles.pillRow}>
            <Pill variant="accent">{`Nível ${profile.level}`}</Pill>
            <Pill variant="gold">{`${profile.streak_current} streak`}</Pill>
          </View>
        </View>
      </View>

      <View style={styles.statGrid}>
        <View style={styles.statBox}>
          <Text style={[styles.statNum, { fontFamily: fonts.display, color: colors.accent }]}>{profile.points}</Text>
          <Text style={[styles.statLbl, { fontFamily: fonts.body }]}>PONTOS TOTAIS</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNum, { fontFamily: fonts.display, color: colors.blue }]}>{posts.length}</Text>
          <Text style={[styles.statLbl, { fontFamily: fonts.body }]}>TREINOS</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNum, { fontFamily: fonts.display, color: colors.gold }]}>—</Text>
          <Text style={[styles.statLbl, { fontFamily: fonts.body }]}>BADGES</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNum, { fontFamily: fonts.display, color: colors.purple }]}>0</Text>
          <Text style={[styles.statLbl, { fontFamily: fonts.body }]}>LIGAS GANHAS</Text>
        </View>
      </View>

      <View style={styles.badgeSection}>
        <View style={styles.badgeHead}>
          <Text style={[styles.badgeTitle, { fontFamily: fonts.bodySemi }]}>Conquistas</Text>
          <Text style={[styles.badgeLink, { fontFamily: fonts.bodySemi }]}>Ver todas</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.badgeScroll}>
          {BADGE_ROW.map((b, i) => (
            <View key={i} style={[styles.badgeItem, !b.earned && { opacity: 0.35 }]}>
              <View
                style={[
                  styles.badgeIcon,
                  {
                    backgroundColor: b.earned ? `${b.color}22` : colors.bgCardAlt,
                    borderColor: b.earned ? `${b.color}44` : colors.border,
                  },
                ]}>
                <Ionicons name={b.icon} size={22} color={b.earned ? b.color : colors.textDim} />
              </View>
              <Text style={[styles.badgeName, { fontFamily: fonts.body }]} numberOfLines={2}>
                {b.name}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <Text style={[styles.gridTitle, { fontFamily: fonts.bodySemi }]}>Treinos Registrados</Text>
    </View>
  );

  return (
    <Screen padded={false} edges={['top']}>
      <FlatList
        ListHeaderComponent={header}
        data={posts}
        numColumns={numColumns}
        keyExtractor={(item) => item.id}
        columnWrapperStyle={{ gap: COL_GAP, paddingHorizontal: spacing.md }}
        contentContainerStyle={{
          paddingBottom: insets.bottom + TAB_BAR_OFFSET,
          gap: COL_GAP,
        }}
        ListEmptyComponent={
          <Text style={[styles.empty, { fontFamily: fonts.body }]}>Nenhum treino no grid ainda.</Text>
        }
        renderItem={({ item, index }) => (
          <Link href={`/(app)/post/${item.id}`} asChild>
            <Pressable style={{ width: cell, height: cell }} accessibilityLabel={`Treino ${index + 1}`}>
              <Image source={{ uri: item.image_url }} style={styles.thumb} contentFit="cover" />
            </Pressable>
          </Link>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    marginBottom: 20,
  },
  brand: { fontSize: 28, color: colors.text, letterSpacing: 1 },
  profileRow: { flexDirection: 'row', gap: 16, paddingHorizontal: spacing.md, marginBottom: 20 },
  bigAvatarWrap: { position: 'relative' },
  bigAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.bgCardAlt,
  },
  bigAvatarPh: { alignItems: 'center', justifyContent: 'center' },
  bigAvatarTxt: { fontSize: 24, color: colors.accent },
  verified: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.bg,
  },
  displayName: { fontSize: 18, fontWeight: '700', color: colors.text },
  handle: { fontSize: 13, color: colors.textMuted, marginTop: 4, marginBottom: 8 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: spacing.md,
    marginBottom: 20,
  },
  statBox: {
    width: (Dimensions.get('window').width - spacing.md * 2 - 12) / 2,
    backgroundColor: colors.bgCardAlt,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statNum: { fontSize: 32, lineHeight: 36 },
  statLbl: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
  badgeSection: { marginBottom: 20 },
  badgeHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    marginBottom: 12,
  },
  badgeTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  badgeLink: { fontSize: 13, color: colors.accent },
  badgeScroll: { paddingHorizontal: spacing.md, gap: 12 },
  badgeItem: { width: 72, alignItems: 'center', gap: 6 },
  badgeIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  badgeName: { fontSize: 10, color: colors.textMuted, textAlign: 'center' },
  gridTitle: { color: colors.text, paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  thumb: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
    backgroundColor: colors.bgCardAlt,
  },
  empty: { color: colors.textMuted, paddingHorizontal: spacing.lg },
});
