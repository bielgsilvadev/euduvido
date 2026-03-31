import { LoadingLogo } from '@/components/ui/LoadingLogo';
import { Screen } from '@/components/ui/Screen';
import { tabListBottomPadding } from '@/constants/tabBar';
import { colors, fonts, screenPaddingX, spacing, tintForId } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { fetchBadgesWithEarned, fetchFollowCounts, updateProfileAvatar } from '@/lib/api';
import { fetchUserChallenges } from '@/lib/challengesApi';
import { badgeAccentColor, badgeIconName } from '@/lib/badges';
import { BETS_PER_LEVEL, userLevelProgress } from '@/lib/userLevel';
import { profileInitials } from '@/lib/format';
import type { BadgeWithEarned, ChallengeWithCreator } from '@/types/models';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import type { Href } from 'expo-router';
import { Link } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  Dimensions,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const COL_GAP = 2;
const numColumns = 3;
const width = Dimensions.get('window').width - screenPaddingX * 2;
const cell = (width - COL_GAP * (numColumns - 1)) / numColumns;

const BADGE_PREVIEW = 10;

const STAT_GAP = 12;

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const { profile, user, refreshProfile } = useAuth();
  const [challenges, setChallenges] = useState<ChallengeWithCreator[]>([]);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [badges, setBadges] = useState<BadgeWithEarned[]>([]);
  const [followCounts, setFollowCounts] = useState({ followers: 0, following: 0 });

  const load = useCallback(async () => {
    if (!user?.id) return;
    const [ch, b, fc] = await Promise.all([
      fetchUserChallenges(user.id),
      fetchBadgesWithEarned(user.id),
      fetchFollowCounts(user.id),
    ]);
    setChallenges(ch);
    setBadges(b);
    setFollowCounts(fc);
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const applyAvatarUri = useCallback(
    async (uri: string) => {
      if (!user?.id) return;
      setAvatarBusy(true);
      const err = await updateProfileAvatar(user.id, uri);
      setAvatarBusy(false);
      if (err) {
        if (Platform.OS === 'web') window.alert(err);
        else Alert.alert('Erro', err);
      } else await refreshProfile();
    },
    [user?.id, refreshProfile],
  );

  const runPickLibrary = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      if (Platform.OS === 'web') window.alert('Precisamos de acesso às fotos.');
      else Alert.alert('Permissão', 'Precisamos de acesso às fotos.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      ...(Platform.OS !== 'web'
        ? { allowsEditing: true, aspect: [1, 1] as [number, number] }
        : {}),
    });
    if (!res.canceled && res.assets[0]) await applyAvatarUri(res.assets[0].uri);
  }, [applyAvatarUri]);

  const runPickCamera = useCallback(async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permissão', 'Precisamos da câmera.');
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      quality: 0.85,
      ...(Platform.OS !== 'web'
        ? { allowsEditing: true, aspect: [1, 1] as [number, number] }
        : {}),
    });
    if (!res.canceled && res.assets[0]) await applyAvatarUri(res.assets[0].uri);
  }, [applyAvatarUri]);

  const openAvatarPicker = useCallback(() => {
    if (!user?.id || avatarBusy) return;
    // No web, Alert com vários botões costuma não fazer nada — abre logo a galeria.
    if (Platform.OS === 'web') {
      void runPickLibrary();
      return;
    }
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancelar', 'Galeria', 'Câmera'],
          cancelButtonIndex: 0,
        },
        (i) => {
          if (i === 1) void runPickLibrary();
          else if (i === 2) void runPickCamera();
        },
      );
      return;
    }
    Alert.alert('Foto de perfil', 'A imagem aparece para todos no feed, ranking e no teu perfil público.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Galeria', onPress: () => void runPickLibrary() },
      { text: 'Câmera', onPress: () => void runPickCamera() },
    ]);
  }, [user?.id, avatarBusy, runPickLibrary, runPickCamera]);

  if (!profile || !user) return null;

  const initials = profileInitials(profile.display_name, profile.username);
  const earnedBadges = badges.filter((x) => x.earned).length;
  const badgePreview = badges.slice(0, BADGE_PREVIEW);
  const duelsWon = profile.total_challenges_completed ?? 0;
  const betsPlaced = profile.total_challenges_created ?? 0;
  const levelProg = userLevelProgress(betsPlaced);
  const levelBarPct = levelProg.maxed
    ? 100
    : Math.min(100, (levelProg.inLevel / BETS_PER_LEVEL) * 100);

  const header = (
    <View style={styles.headerRoot}>
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
          <Pressable
            onPress={openAvatarPicker}
            disabled={avatarBusy}
            accessibilityRole="button"
            accessibilityLabel="Alterar foto de perfil"
            hitSlop={8}
            style={styles.avatarPressable}>
            <View style={styles.bigAvatarWrap} collapsable={false}>
              {profile.avatar_url ? (
                <Image
                  source={{ uri: profile.avatar_url }}
                  style={styles.bigAvatar}
                  pointerEvents="none"
                />
              ) : (
                <View style={[styles.bigAvatar, styles.bigAvatarPh]}>
                  <Text style={[styles.bigAvatarTxt, { fontFamily: fonts.display }]}>{initials}</Text>
                </View>
              )}
              <View style={styles.avatarEditBadge}>
                {avatarBusy ? (
                  <LoadingLogo size="small" />
                ) : (
                  <Ionicons name="camera" size={16} color={colors.accent} />
                )}
              </View>
            </View>
          </Pressable>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.displayName, { fontFamily: fonts.bodyBold }]}>{profile.display_name || profile.username}</Text>
          <Text style={[styles.handle, { fontFamily: fonts.body }]}>@{profile.username}</Text>
          <View style={styles.socialRow}>
            <Link href={`/(app)/user/${user.id}/followers`} asChild>
              <Pressable accessibilityRole="button">
                <Text style={[styles.socialStat, { fontFamily: fonts.bodySemi }]}>
                  <Text style={styles.socialNum}>{followCounts.followers}</Text> seguidores
                </Text>
              </Pressable>
            </Link>
            <Text style={styles.socialDot}>·</Text>
            <Link href={`/(app)/user/${user.id}/following`} asChild>
              <Pressable accessibilityRole="button">
                <Text style={[styles.socialStat, { fontFamily: fonts.bodySemi }]}>
                  <Text style={styles.socialNum}>{followCounts.following}</Text> seguindo
                </Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </View>

      <View style={styles.levelCard}>
        <View style={styles.levelCardTop}>
          <View style={styles.levelTitleRow}>
            <Ionicons name="trophy" size={18} color={colors.gold} />
            <Text style={[styles.levelTitle, { fontFamily: fonts.bodySemi }]}>
              Nível {profile.level}
            </Text>
          </View>
          <Text style={[styles.levelSub, { fontFamily: fonts.body }]}>
            {levelProg.maxed
              ? 'Nível máximo — lenda das apostas!'
              : levelProg.betsUntilNext === 1
                ? `Sobe para o nível ${levelProg.level + 1} na próxima aposta!`
                : `${levelProg.betsUntilNext} apostas até o nível ${levelProg.level + 1}`}
          </Text>
        </View>
        <View style={styles.levelBarTrack}>
          <View style={[styles.levelBarFill, { width: `${levelBarPct}%` }]} />
        </View>
        <Text style={[styles.levelFoot, { fontFamily: fonts.body }]}>
          {betsPlaced} aposta{betsPlaced === 1 ? '' : 's'} criada{betsPlaced === 1 ? '' : 's'} · +1 nível a cada {BETS_PER_LEVEL} apostas
        </Text>
      </View>

      <View style={styles.statRow}>
        <View style={[styles.statBox, styles.statBoxHalf]}>
          <Text style={[styles.statNum, styles.statNumWins, { fontFamily: fonts.display }]}>{duelsWon}</Text>
          <Text style={[styles.statLbl, { fontFamily: fonts.body }]}>DUELOS VENCIDOS</Text>
        </View>
        <View style={[styles.statBox, styles.statBoxHalf]}>
          <Text style={[styles.statNum, styles.statNumBadges, { fontFamily: fonts.display }]}>
            {earnedBadges}
          </Text>
          <Text style={[styles.statLbl, { fontFamily: fonts.body }]}>CONQUISTAS</Text>
        </View>
      </View>

      <View style={styles.badgeSection}>
        <View style={styles.badgeHead}>
          <Text style={[styles.badgeTitle, { fontFamily: fonts.bodySemi }]}>Conquistas</Text>
          <Link href="/(app)/achievements" asChild>
            <Pressable accessibilityRole="button" accessibilityLabel="Ver todas as conquistas" hitSlop={8}>
              <Text style={[styles.badgeLink, { fontFamily: fonts.bodySemi }]}>Ver todas</Text>
            </Pressable>
          </Link>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.badgeScroll}>
          {badgePreview.length === 0 ? (
            <Text style={[styles.badgeEmpty, { fontFamily: fonts.body }]}>Nenhuma conquista no catálogo.</Text>
          ) : null}
          {badgePreview.map((b) => {
            const accent = badgeAccentColor(b.icon_key);
            const icon = badgeIconName(b.icon_key);
            return (
              <View key={b.id} style={[styles.badgeItem, !b.earned && { opacity: 0.35 }]}>
                <View
                  style={[
                    styles.badgeIcon,
                    {
                      backgroundColor: b.earned ? `${accent}22` : colors.bgCardAlt,
                      borderColor: b.earned ? `${accent}44` : colors.border,
                    },
                  ]}>
                  <Ionicons name={icon} size={22} color={b.earned ? accent : colors.textDim} />
                </View>
                <Text style={[styles.badgeName, { fontFamily: fonts.body }]} numberOfLines={2}>
                  {b.name}
                </Text>
              </View>
            );
          })}
        </ScrollView>
      </View>

      <Text style={[styles.gridTitle, { fontFamily: fonts.bodySemi }]}>Meus desafios</Text>
    </View>
  );

  return (
    <Screen padded={false} edges={['top']}>
      <FlatList
        ListHeaderComponent={header}
        /** Com `numColumns`, no web o cabeçalho herda a largura de uma célula — força largura do ecrã para o grid 2×2. */
        ListHeaderComponentStyle={{ width: windowWidth }}
        data={challenges}
        numColumns={numColumns}
        keyExtractor={(item) => item.id}
        removeClippedSubviews={false}
        columnWrapperStyle={{ gap: COL_GAP, paddingHorizontal: screenPaddingX }}
        contentContainerStyle={{
          paddingBottom: tabListBottomPadding(insets.bottom) + 56,
          gap: COL_GAP,
        }}
        ListEmptyComponent={
          <Text style={[styles.empty, { fontFamily: fonts.body }]}>Crie sua primeira aposta pelo botão +.</Text>
        }
        renderItem={({ item, index }) => (
          <Link href={`/(app)/challenge/${item.id}` as Href} asChild>
            <Pressable style={{ width: cell, height: cell }} accessibilityLabel={`Desafio ${index + 1}`}>
              {item.cover_image_url ? (
                <Image source={{ uri: item.cover_image_url }} style={styles.thumb} contentFit="cover" />
              ) : (
                <View
                  style={[
                    styles.thumb,
                    {
                      backgroundColor: tintForId(item.id),
                      alignItems: 'center',
                      justifyContent: 'center',
                    },
                  ]}>
                  <Ionicons name="flag" size={22} color="rgba(255,255,255,0.4)" />
                </View>
              )}
            </Pressable>
          </Link>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRoot: {
    alignSelf: 'stretch',
  },
  headTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: screenPaddingX,
    marginBottom: 20,
  },
  brand: { fontSize: 28, color: colors.text, letterSpacing: 1 },
  profileRow: { flexDirection: 'row', gap: 16, paddingHorizontal: screenPaddingX, marginBottom: 20 },
  avatarPressable: { alignSelf: 'flex-start', borderRadius: 36 },
  bigAvatarWrap: {
    position: 'relative',
    width: 72,
    height: 72,
  },
  bigAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.bgCardAlt,
  },
  bigAvatarPh: { alignItems: 'center', justifyContent: 'center' },
  bigAvatarTxt: { fontSize: 24, color: colors.accent },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.bg,
  },
  displayName: { fontSize: 18, fontWeight: '700', color: colors.text },
  handle: { fontSize: 13, color: colors.textMuted, marginTop: 4, marginBottom: 6 },
  socialRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  socialStat: { fontSize: 13, color: colors.textMuted },
  socialNum: { color: colors.text, fontWeight: '600' },
  socialDot: { color: colors.textDim, fontSize: 13 },
  levelCard: {
    marginHorizontal: screenPaddingX,
    marginBottom: 20,
    padding: 16,
    borderRadius: 14,
    backgroundColor: colors.bgCardAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  levelCardTop: { marginBottom: 10 },
  levelTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  levelTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  levelSub: { fontSize: 13, color: colors.textMuted, marginTop: 6, lineHeight: 18 },
  levelBarTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  levelBarFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  levelFoot: { fontSize: 11, color: colors.textDim, marginTop: 10 },
  statRow: {
    flexDirection: 'row',
    gap: STAT_GAP,
    paddingHorizontal: screenPaddingX,
    marginBottom: 20,
    width: '100%',
  },
  statBox: {
    backgroundColor: colors.bgCardAlt,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  statBoxHalf: { flex: 1, minWidth: 0 },
  statNum: { fontSize: 32, lineHeight: 36, textAlign: 'center' },
  statNumWins: { color: colors.accent },
  statNumBadges: { color: colors.gold },
  statLbl: { fontSize: 11, color: colors.textMuted, marginTop: 4, textAlign: 'center', alignSelf: 'stretch' },
  badgeSection: { marginBottom: 20 },
  badgeHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: screenPaddingX,
    marginBottom: 12,
  },
  badgeTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  badgeLink: { fontSize: 13, color: colors.accent },
  badgeScroll: { paddingHorizontal: screenPaddingX, gap: 12 },
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
  badgeEmpty: { color: colors.textMuted, fontSize: 12, paddingVertical: 8, maxWidth: 280 },
  gridTitle: { color: colors.text, paddingHorizontal: screenPaddingX, marginBottom: spacing.sm },
  thumb: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
    backgroundColor: colors.bgCardAlt,
  },
  empty: { color: colors.textMuted, paddingHorizontal: screenPaddingX },
});
