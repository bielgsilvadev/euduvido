import { BrandLogo } from '@/components/BrandLogo';
import { ChallengeCard } from '@/components/challenge/ChallengeCard';
import { Screen } from '@/components/ui/Screen';
import { tabListBottomPadding } from '@/constants/tabBar';
import { colors, fonts, radii, screenPaddingX, spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { fetchFriendsFeedChallenges, fetchMineFeedChallenges, setChallengeReaction } from '@/lib/challengesApi';
import { notifyError } from '@/lib/notify';
import type { ChallengeWithCreator } from '@/types/models';
import { type Href, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type FeedTab = 'mine' | 'friends';

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<ChallengeWithCreator[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<FeedTab>('mine');

  const load = useCallback(async () => {
    if (!user?.id) {
      setChallenges([]);
      return;
    }
    if (tab === 'mine') {
      setChallenges(await fetchMineFeedChallenges(user.id, 50));
    } else {
      setChallenges(await fetchFriendsFeedChallenges(user.id, 50));
    }
  }, [user?.id, tab]);

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

  async function onReact(ch: ChallengeWithCreator, next: 'cheer' | 'doubt') {
    if (!user?.id) {
      notifyError('Entre na conta para reagir.', 'Eu Duvido!');
      return;
    }
    const current = ch.my_reaction;
    const toggleOff = current === next;
    const newReaction = toggleOff ? null : next;

    const prev = [...challenges];
    setChallenges((list) =>
      list.map((x) => {
        if (x.id !== ch.id) return x;
        let cheers = x.cheers_count;
        let doubts = x.doubters_count;
        if (current === 'cheer') cheers = Math.max(0, cheers - 1);
        if (current === 'doubt') doubts = Math.max(0, doubts - 1);
        if (!toggleOff) {
          if (next === 'cheer') cheers += 1;
          else doubts += 1;
        }
        return {
          ...x,
          my_reaction: newReaction,
          cheers_count: cheers,
          doubters_count: doubts,
        };
      }),
    );

    const { ok, error } = await setChallengeReaction(ch.id, user.id, newReaction);
    if (!ok) {
      setChallenges(prev);
      if (error) notifyError(error, 'Reação');
    } else {
      await load();
    }
  }

  const emptyMessage =
    !user?.id
      ? 'Entre na conta para ver seu feed de apostas.'
      : tab === 'mine'
        ? 'Você ainda não tem apostas neste feed. Crie um desafio pelo botão + no centro da barra inferior.'
        : 'Siga pessoas na aba Explorar para ver aqui as apostas públicas que elas criam.';

  const listHeader = (
    <View style={styles.header}>
      <View style={styles.hero}>
        <BrandLogo maxWidth={216} style={styles.logo} />
        <Text style={[styles.tagline, { fontFamily: fonts.body }]}>
          Aposte com quem você confia: define o árbitro, as provas e o prazo — e quem te segue acompanha tudo em tempo
          real.
        </Text>
      </View>

      <View style={styles.segment}>
        <Pressable
          onPress={() => setTab('mine')}
          style={[styles.segmentItem, tab === 'mine' && styles.segmentItemActive]}
          accessibilityRole="tab"
          accessibilityState={{ selected: tab === 'mine' }}
          accessibilityLabel="Minhas apostas">
          <Text
            style={[
              styles.segmentLabel,
              { fontFamily: fonts.bodySemi },
              tab === 'mine' && styles.segmentLabelActive,
            ]}>
            Minhas apostas
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setTab('friends')}
          style={[styles.segmentItem, tab === 'friends' && styles.segmentItemActive]}
          accessibilityRole="tab"
          accessibilityState={{ selected: tab === 'friends' }}
          accessibilityLabel="Apostas dos amigos">
          <Text
            style={[
              styles.segmentLabel,
              { fontFamily: fonts.bodySemi },
              tab === 'friends' && styles.segmentLabelActive,
            ]}>
            Dos amigos
          </Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <Screen padded={false} edges={['top']}>
      <FlatList
        data={challenges}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={listHeader}
        contentContainerStyle={{
          paddingHorizontal: screenPaddingX,
          paddingBottom: tabListBottomPadding(insets.bottom) + spacing.md,
          paddingTop: spacing.md,
        }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        ListEmptyComponent={<Text style={[styles.empty, { fontFamily: fonts.body }]}>{emptyMessage}</Text>}
        renderItem={({ item }) => (
          <ChallengeCard
            challenge={item}
            onPressCheer={() => onReact(item, 'cheer')}
            onPressDoubt={() => onReact(item, 'doubt')}
            onPressComments={() => router.push(`/(app)/challenge/${item.id}` as Href)}
          />
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.lg,
  },
  hero: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logo: {
    alignSelf: 'center',
    width: 216,
  },
  tagline: {
    marginTop: spacing.md,
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 340,
    paddingHorizontal: spacing.xs,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.bgCardAlt,
    borderRadius: radii.md,
    padding: 4,
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentItemActive: {
    backgroundColor: colors.accentGlow,
    borderWidth: 1,
    borderColor: colors.accentDim,
  },
  segmentLabel: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },
  segmentLabelActive: {
    color: colors.accent,
    fontSize: 13,
  },
  empty: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
    lineHeight: 22,
    paddingHorizontal: spacing.sm,
  },
});
