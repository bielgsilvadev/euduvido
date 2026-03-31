import { ChallengeCard } from '@/components/challenge/ChallengeCard';
import { LoadingLogo } from '@/components/ui/LoadingLogo';
import { Screen } from '@/components/ui/Screen';
import { colors, fonts, screenPaddingX, spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { fetchChallengeById, setChallengeReaction } from '@/lib/challengesApi';
import { notifyError } from '@/lib/notify';
import type { ChallengeMeta, ChallengeWithCreator } from '@/types/models';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ChallengeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [c, setC] = useState<ChallengeWithCreator | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id || typeof id !== 'string') return;
    setLoading(true);
    const row = await fetchChallengeById(id, user?.id);
    setC(row);
    setLoading(false);
  }, [id, user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function onReact(next: 'cheer' | 'doubt') {
    if (!user?.id || !c) return;
    const current = c.my_reaction;
    const toggleOff = current === next;
    const newReaction = toggleOff ? null : next;
    let cheers = c.cheers_count;
    let doubts = c.doubters_count;
    if (current === 'cheer') cheers = Math.max(0, cheers - 1);
    if (current === 'doubt') doubts = Math.max(0, doubts - 1);
    if (!toggleOff) {
      if (next === 'cheer') cheers += 1;
      else doubts += 1;
    }
    setC({ ...c, my_reaction: newReaction, cheers_count: cheers, doubters_count: doubts });
    const { ok, error } = await setChallengeReaction(c.id, user.id, newReaction);
    if (!ok) {
      notifyError(error ?? 'Erro na reação', 'Eu Duvido!');
      load();
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <LoadingLogo />
      </View>
    );
  }

  if (!c) {
    return (
      <Screen padded>
        <Text style={[styles.miss, { fontFamily: fonts.body }]}>Desafio não encontrado.</Text>
        <Pressable onPress={() => router.back()} accessibilityRole="button">
          <Text style={{ color: colors.accent, fontFamily: fonts.bodySemi }}>Voltar</Text>
        </Pressable>
      </Screen>
    );
  }

  const meta = (c.failure_destination_details as ChallengeMeta | null) ?? null;
  const duel = meta?.duel;
  const payoutLabel =
    meta?.payout_destination === 'developers' || c.failure_destination === 'developers'
      ? 'Desenvolvedores'
      : meta?.payout_destination === 'winner' || c.failure_destination === 'rival'
        ? 'Vencedor'
        : meta?.destination_label?.trim() || 'Destino (legado)';
  const duelLabel =
    duel?.mode === 'direct'
      ? `Duelo direto com ${duel.challenged_username ? `@${duel.challenged_username}` : 'desafiado pendente'}`
      : 'Aposta aberta (qualquer usuário pode aceitar)';
  const arbiterLabel = duel?.arbiter_username ? `@${duel.arbiter_username}` : 'Árbitro ainda não definido';

  return (
    <Screen padded={false} edges={['top']}>
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 8) }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="Voltar">
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </Pressable>
        <Text style={[styles.topTitle, { fontFamily: fonts.bodyBold }]} numberOfLines={1}>
          Desafio
        </Text>
        <View style={{ width: 28 }} />
      </View>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: screenPaddingX,
          paddingBottom: insets.bottom + spacing.xl,
        }}>
        <ChallengeCard
          challenge={c}
          disableChallengeLink
          onPressCheer={() => onReact('cheer')}
          onPressDoubt={() => onReact('doubt')}
        />
        <Text style={[styles.section, { fontFamily: fonts.bodySemi }]}>Descrição</Text>
        <Text style={[styles.body, { fontFamily: fonts.body }]}>{c.description || '—'}</Text>
        <Text style={[styles.section, { fontFamily: fonts.bodySemi }]}>Estrutura da aposta</Text>
        <Text style={[styles.body, { fontFamily: fonts.body }]}>⚔️ {duelLabel}</Text>
        <Text style={[styles.body, { fontFamily: fonts.body }]}>🧑‍⚖️ {arbiterLabel}</Text>
        <Text style={[styles.body, { fontFamily: fonts.body }]}>
          💸 Destino em caso de derrota: {payoutLabel} · taxa plataforma 10%
        </Text>
        <Text style={[styles.section, { fontFamily: fonts.bodySemi }]}>Comentários e julgamento</Text>
        <Text style={[styles.body, { fontFamily: fonts.body, color: colors.textMuted }]}>
          Reações já estão ativas. Linha do tempo de provas, comentários em fio e voto do árbitro serão exibidos aqui.
        </Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: screenPaddingX,
    paddingBottom: spacing.sm,
  },
  topTitle: { flex: 1, textAlign: 'center', color: colors.text, fontSize: 16 },
  section: { color: colors.text, fontSize: 16, marginTop: spacing.lg, marginBottom: spacing.sm },
  body: { color: colors.textSecondary, fontSize: 15, lineHeight: 22 },
  miss: { color: colors.textMuted, marginBottom: 16 },
});
