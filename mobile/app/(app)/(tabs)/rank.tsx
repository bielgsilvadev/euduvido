import { Pill } from '@/components/ui/Pill';
import { TabSegment } from '@/components/ui/TabSegment';
import { Screen } from '@/components/ui/Screen';
import { tabListBottomPadding } from '@/constants/tabBar';
import { colors, fonts, radii, screenPaddingX, spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { fetchFriendsRanking, fetchRanking } from '@/lib/api';
import { profileInitials } from '@/lib/format';
import type { Profile } from '@/types/models';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function reputationOf(u: Profile): number {
  return u.reputation_score ?? u.points;
}

function Podium({ rows }: { rows: Profile[] }) {
  const order = [rows[1], rows[0], rows[2]].filter(Boolean) as Profile[];
  const heights = [100, 130, 80];
  const rankColors = [colors.textMuted, colors.gold, '#CD7F32'];
  const positions = [2, 1, 3];

  return (
    <View style={styles.podiumRow}>
      {order.map((u, i) => {
        const initials = profileInitials(u.display_name, u.username);
        const avatarSize = i === 1 ? 48 : 38;
        return (
          <Link key={u.id} href={`/(app)/user/${u.id}`} asChild>
            <Pressable style={styles.podiumCol} accessibilityRole="button" accessibilityLabel="Ver perfil">
              {u.avatar_url ? (
                <Image
                  source={{ uri: u.avatar_url }}
                  style={[styles.podiumAvatar, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]}
                />
              ) : (
                <View
                  style={[
                    styles.podiumAvatar,
                    styles.podiumAvatarPh,
                    { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 },
                  ]}>
                  <Text style={[styles.podiumInitials, { fontFamily: fonts.bodySemi }]}>{initials}</Text>
                </View>
              )}
              <Text style={[styles.podiumName, { fontFamily: fonts.bodySemi }]} numberOfLines={1}>
                {(u.display_name || u.username).split(' ')[0]}
              </Text>
              <View style={[styles.podiumBar, { height: heights[i] }]}>
                <Text style={[styles.podiumPos, { fontFamily: fonts.display, color: rankColors[i] }]}>
                  #{positions[i]}
                </Text>
                <Text style={[styles.podiumPts, { fontFamily: fonts.bodySemi }]}>Rep. {reputationOf(u)}</Text>
              </View>
            </Pressable>
          </Link>
        );
      })}
    </View>
  );
}

export default function RankScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [tab, setTab] = useState<'global' | 'amigos'>('global');
  const [rows, setRows] = useState<Profile[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (tab === 'global') {
      setRows(await fetchRanking(60));
    } else if (user?.id) {
      setRows(await fetchFriendsRanking(user.id, 80));
    } else {
      setRows([]);
    }
  }, [tab, user?.id]);

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

  const header = (
    <View>
      <View style={styles.header}>
        <View>
          <Text style={[styles.sub, { fontFamily: fonts.body }]}>Credibilidade em apostas</Text>
          <Text style={[styles.title, { fontFamily: fonts.display }]}>RANKING</Text>
        </View>
        <Pill
          variant="blue"
          leading={
            <Ionicons name={tab === 'amigos' ? 'people-outline' : 'globe-outline'} size={12} color={colors.blue} />
          }>
          {tab === 'global' ? 'Global' : 'Amigos'}
        </Pill>
      </View>
      <View style={{ marginBottom: 20 }}>
        <TabSegment
          tabs={[
            { key: 'global', label: 'Global' },
            { key: 'amigos', label: 'Amigos' },
          ]}
          active={tab}
          onChange={(k) => setTab(k as typeof tab)}
        />
      </View>
      {rows.length >= 3 ? <Podium rows={rows} /> : null}
    </View>
  );

  const scrollContentStyle = {
    paddingHorizontal: screenPaddingX,
    paddingBottom: tabListBottomPadding(insets.bottom),
  };

  return (
    <Screen padded={false} edges={['top']}>
      <FlatList
        data={rows}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={header}
        contentContainerStyle={scrollContentStyle}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
        ListEmptyComponent={
          <Text style={[styles.empty, { fontFamily: fonts.body }]}>
            Sem dados ainda. Quando houver mais contas ativas, o ranking aparece aqui.
          </Text>
        }
        renderItem={({ item, index }) => {
          const rank = index + 1;
          const isMe = user?.id === item.id;
          const rankColor =
            rank === 1 ? colors.gold : rank === 2 ? '#C0C0C0' : rank === 3 ? '#CD7F32' : colors.textMuted;
          const initials = profileInitials(item.display_name, item.username);
          return (
            <Link href={`/(app)/user/${item.id}`} asChild>
              <Pressable
                style={StyleSheet.flatten([styles.row, isMe ? styles.rowMe : null])}
                accessibilityRole="button"
                accessibilityLabel={`${rank} lugar`}>
                <Text style={[styles.rank, { fontFamily: fonts.display, color: rankColor }]}>
                  {rank === 1 ? '👑' : `#${rank}`}
                </Text>
                {item.avatar_url ? (
                  <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarPh]}>
                    <Text style={{ fontFamily: fonts.bodySemi, color: colors.accent, fontSize: 12 }}>
                      {initials}
                    </Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[styles.name, { fontFamily: fonts.bodySemi }]} numberOfLines={1}>
                      {item.display_name || item.username}
                    </Text>
                    {isMe ? (
                      <View style={styles.youPill}>
                        <Text style={[styles.youTxt, { fontFamily: fonts.bodySemi }]}>VOCÊ</Text>
                      </View>
                    ) : null}
                  </View>
                  <View style={styles.metaRow}>
                    <Ionicons name="ribbon-outline" size={14} color={colors.gold} />
                    <Text style={[styles.meta, { fontFamily: fonts.body }]}>
                      Nv. {item.level} · {item.total_challenges_created ?? 0} apostas
                    </Text>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.pts, { fontFamily: fonts.display }]}>{reputationOf(item)}</Text>
                  <Text style={[styles.ptsLbl, { fontFamily: fonts.body }]}>REPUTAÇÃO</Text>
                </View>
              </Pressable>
            </Link>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: spacing.md,
  },
  sub: { fontSize: 13, color: colors.textMuted },
  title: { fontSize: 28, color: colors.text, letterSpacing: 1 },
  podiumRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 12,
    height: 200,
    marginBottom: 24,
  },
  podiumCol: { alignItems: 'center', gap: 8, maxWidth: 90 },
  podiumAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.bgCardAlt,
  },
  podiumAvatarPh: { alignItems: 'center', justifyContent: 'center' },
  podiumInitials: { fontSize: 12, color: colors.accent },
  podiumName: { fontSize: 12, color: colors.text, textAlign: 'center' },
  podiumBar: {
    width: 80,
    backgroundColor: colors.bgCardAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomWidth: 0,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  podiumPos: { fontSize: 28 },
  podiumPts: { fontSize: 12, color: colors.accent },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  rowMe: {
    borderColor: colors.accentDim,
    backgroundColor: 'rgba(200,241,53,0.04)',
  },
  rank: { fontSize: 20, minWidth: 36 },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.bgCardAlt,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPh: {},
  name: { color: colors.text, fontSize: 14 },
  youPill: {
    backgroundColor: colors.accentGlow,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  youTxt: { fontSize: 9, color: colors.accent },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  meta: { color: colors.textMuted, fontSize: 12 },
  pts: { fontSize: 24, color: colors.accent },
  ptsLbl: { fontSize: 10, color: colors.textMuted },
});
