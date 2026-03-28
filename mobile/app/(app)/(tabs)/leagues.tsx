import { LeagueCard } from '@/components/LeagueCard';
import { TabSegment } from '@/components/ui/TabSegment';
import { Screen } from '@/components/ui/Screen';
import { colors, fonts, radii, spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { fetchLeagueMemberCounts, fetchLeagues, fetchMyLeagues } from '@/lib/api';
import type { LeagueRow } from '@/types/models';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Link } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TAB_BAR_OFFSET = 96;

export default function LeaguesScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [tab, setTab] = useState<'minhas' | 'explorar'>('minhas');
  const [all, setAll] = useState<LeagueRow[]>([]);
  const [mine, setMine] = useState<LeagueRow[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [list, my] = await Promise.all([fetchLeagues(), user?.id ? fetchMyLeagues(user.id) : Promise.resolve([])]);
    setAll(list);
    setMine(my);
    const ids = list.map((l) => l.id);
    setCounts(await fetchLeagueMemberCounts(ids));
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const exploreList = useMemo(() => {
    const ids = new Set(mine.map((l) => l.id));
    return all.filter((l) => !ids.has(l.id));
  }, [all, mine]);

  const data = tab === 'minhas' ? mine : exploreList;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const header = (
    <View style={{ paddingTop: Math.max(insets.top, 12) }}>
      <View style={styles.top}>
        <View>
          <Text style={[styles.sub, { fontFamily: fonts.body }]}>Competições</Text>
          <Text style={[styles.title, { fontFamily: fonts.display }]}>LIGAS</Text>
        </View>
        <Link href="/(app)/create-league" asChild>
          <Pressable style={styles.createBtn} accessibilityLabel="Criar liga">
            <Ionicons name="add" size={16} color="#000" />
            <Text style={[styles.createTxt, { fontFamily: fonts.bodySemi }]}>Criar Liga</Text>
          </Pressable>
        </Link>
      </View>
      <View style={{ paddingHorizontal: spacing.md, marginBottom: 20 }}>
        <TabSegment
          tabs={[
            { key: 'minhas', label: 'Minhas Ligas' },
            { key: 'explorar', label: 'Explorar' },
          ]}
          active={tab}
          onChange={(k) => setTab(k as 'minhas' | 'explorar')}
        />
      </View>
    </View>
  );

  return (
    <Screen padded={false} edges={['top']}>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={header}
        contentContainerStyle={{
          paddingHorizontal: spacing.md,
          paddingBottom: insets.bottom + TAB_BAR_OFFSET,
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
        ListEmptyComponent={
          <Text style={[styles.empty, { fontFamily: fonts.body }]}>
            {tab === 'minhas'
              ? 'Você ainda não entrou em nenhuma liga. Explore ou crie uma.'
              : 'Nenhuma liga aberta para explorar.'}
          </Text>
        }
        renderItem={({ item }) => <LeagueCard league={item} memberCount={counts[item.id]} />}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  sub: { fontSize: 13, color: colors.textMuted },
  title: { fontSize: 28, color: colors.text, letterSpacing: 1 },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.accent,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radii.md,
  },
  createTxt: { fontSize: 13, fontWeight: '600', color: '#000' },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
});
