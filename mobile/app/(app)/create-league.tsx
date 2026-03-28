import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { colors, fonts, radii, spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { createLeague } from '@/lib/api';
import type { LeagueRow } from '@/types/models';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

export default function CreateLeagueScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('30');
  const [maxP, setMaxP] = useState('20');
  const [fee, setFee] = useState('');
  const [type, setType] = useState<'free' | 'paid'>('free');
  const [prize, setPrize] = useState<LeagueRow['prize_distribution']>('winner_take_all');
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!user) return;
    if (!name.trim()) {
      Alert.alert('Nome', 'Defina o nome da liga.');
      return;
    }
    const d = parseInt(duration, 10);
    const m = parseInt(maxP, 10);
    if (!Number.isFinite(d) || d < 1) {
      Alert.alert('Duração', 'Use um número válido de dias.');
      return;
    }
    if (!Number.isFinite(m) || m < 2) {
      Alert.alert('Participantes', 'Mínimo 2 vagas.');
      return;
    }
    const feeCents =
      type === 'paid' ? Math.round(parseFloat(fee.replace(',', '.')) * 100) || 0 : 0;
    if (type === 'paid' && feeCents <= 0) {
      Alert.alert('Taxa', 'Defina o valor da entrada em reais.');
      return;
    }
    setLoading(true);
    const res = await createLeague(user.id, {
      name: name.trim(),
      description: description.trim(),
      league_type: type,
      entry_fee_cents: feeCents,
      duration_days: d,
      max_participants: m,
      prize_distribution: prize,
    });
    setLoading(false);
    if (!res) {
      Alert.alert('Erro', 'Não foi possível criar a liga.');
      return;
    }
    Alert.alert('Liga criada', 'Regras travadas no início. Convide o time.', [
      { text: 'OK', onPress: () => router.replace(`/(app)/league/${res.id}`) },
    ]);
  }

  return (
    <Screen>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { fontFamily: fonts.display }]}>Nova liga</Text>
        <Text style={[styles.hint, { fontFamily: fonts.body }]}>
          Ligas pagas exigem fluxo de pagamento (Stripe) no backend antes de liberar entrada na App Store.
        </Text>

        <Text style={[styles.label, { fontFamily: fonts.bodySemi }]}>Nome</Text>
        <TextInput
          placeholder="Iron League Q1"
          placeholderTextColor={colors.onSurfaceVariant}
          value={name}
          onChangeText={setName}
          style={[styles.input, { fontFamily: fonts.body }]}
        />

        <Text style={[styles.label, { fontFamily: fonts.bodySemi }]}>Descrição</Text>
        <TextInput
          placeholder="Regras e clima do grupo"
          placeholderTextColor={colors.onSurfaceVariant}
          value={description}
          onChangeText={setDescription}
          multiline
          style={[styles.input, styles.area, { fontFamily: fonts.body }]}
        />

        <Text style={[styles.label, { fontFamily: fonts.bodySemi }]}>Tipo</Text>
        <View style={styles.row}>
          {(['free', 'paid'] as const).map((t) => (
            <PrimaryButton
              key={t}
              title={t === 'free' ? 'Grátis' : 'Paga'}
              onPress={() => setType(t)}
              variant={type === t ? 'primary' : 'ghost'}
              style={{ flex: 1, minHeight: 48 }}
            />
          ))}
        </View>

        {type === 'paid' ? (
          <>
            <Text style={[styles.label, { fontFamily: fonts.bodySemi }]}>Taxa de entrada (R$)</Text>
            <TextInput
              placeholder="50,00"
              placeholderTextColor={colors.onSurfaceVariant}
              keyboardType="decimal-pad"
              value={fee}
              onChangeText={setFee}
              style={[styles.input, { fontFamily: fonts.body }]}
            />
          </>
        ) : null}

        <Text style={[styles.label, { fontFamily: fonts.bodySemi }]}>Duração (dias)</Text>
        <TextInput
          keyboardType="number-pad"
          value={duration}
          onChangeText={setDuration}
          style={[styles.input, { fontFamily: fonts.body }]}
        />

        <Text style={[styles.label, { fontFamily: fonts.bodySemi }]}>Máx. participantes</Text>
        <TextInput
          keyboardType="number-pad"
          value={maxP}
          onChangeText={setMaxP}
          style={[styles.input, { fontFamily: fonts.body }]}
        />

        <Text style={[styles.label, { fontFamily: fonts.bodySemi }]}>Distribuição do pote</Text>
        <View style={styles.col}>
          {(
            [
              ['winner_take_all', 'Vencedor leva tudo'],
              ['top_3', 'Top 3'],
              ['proportional', 'Proporcional aos pontos'],
            ] as const
          ).map(([k, label]) => (
            <PrimaryButton
              key={k}
              title={label}
              onPress={() => setPrize(k)}
              variant={prize === k ? 'secondary' : 'ghost'}
              style={{ marginBottom: spacing.sm }}
            />
          ))}
        </View>

        <PrimaryButton title="Criar liga" onPress={submit} loading={loading} style={{ marginTop: spacing.lg }} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 26, color: colors.primary },
  hint: { color: colors.onSurfaceVariant, marginTop: spacing.sm, marginBottom: spacing.md },
  label: { color: colors.onSurface, marginTop: spacing.md, marginBottom: spacing.xs },
  input: {
    backgroundColor: colors.surfaceLowest,
    borderRadius: radii.md,
    padding: spacing.md,
    color: colors.onSurface,
    fontSize: 16,
  },
  area: { minHeight: 88, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  col: { marginTop: spacing.sm },
});
