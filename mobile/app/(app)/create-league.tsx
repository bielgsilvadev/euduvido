import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { colors, fonts, formTextInputStyle, spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { createLeague } from '@/lib/api';
import { notifyError, notifySuccess } from '@/lib/notify';
import { isSupabaseConfigured } from '@/lib/supabase';
import type { LeagueRow } from '@/types/models';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

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
    if (!isSupabaseConfigured) {
      notifyError('Configura EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY no .env.', 'Supabase');
      return;
    }
    if (!user) {
      notifyError('Precisas de sessão iniciada para criar uma comunidade.', 'Sessão');
      return;
    }
    if (!name.trim()) {
      notifyError('Defina o nome da comunidade.', 'Nome');
      return;
    }
    const d = parseInt(duration, 10);
    const m = parseInt(maxP, 10);
    if (!Number.isFinite(d) || d < 1) {
      notifyError('Use um número válido de dias (mínimo 1).', 'Duração');
      return;
    }
    if (!Number.isFinite(m) || m < 2) {
      notifyError('Mínimo 2 vagas na comunidade.', 'Participantes');
      return;
    }
    const feeCents =
      type === 'paid' ? Math.round(parseFloat(fee.replace(',', '.')) * 100) || 0 : 0;
    if (type === 'paid' && feeCents <= 0) {
      notifyError('Defina o valor da entrada em reais.', 'Taxa');
      return;
    }
    setLoading(true);
    try {
      const res = await createLeague(user.id, {
        name: name.trim(),
        description: description.trim(),
        league_type: type,
        entry_fee_cents: feeCents,
        duration_days: d,
        max_participants: m,
        prize_distribution: prize,
      });
      if (!res.ok) {
        notifyError(res.message, 'Criar comunidade');
        return;
      }
      notifySuccess('Comunidade criada. Convide pessoas para acompanhar e disputar duelos.', 'Comunidade criada', () =>
        router.replace(`/(app)/league/${res.id}`),
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      notifyError(msg || 'Erro inesperado.', 'Criar comunidade');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen edges={['bottom']} belowNativeHeader>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}>
        <ScrollView
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
          <Text style={[styles.title, { fontFamily: fonts.display }]}>Nova comunidade</Text>
          <Text style={[styles.hint, { fontFamily: fonts.body }]}>
            Comunidades ajudam a organizar duelos por grupo. Se houver entrada paga, o fluxo de pagamento deve estar
            ativo no backend (Stripe) antes da publicação em loja.
          </Text>

          <Text style={[styles.label, { fontFamily: fonts.bodySemi }]}>Nome</Text>
          <TextInput
            placeholder="Mesa da firma — Março"
            placeholderTextColor={colors.onSurfaceVariant}
            value={name}
            onChangeText={setName}
            style={[formTextInputStyle, { fontFamily: fonts.body }]}
          />

          <Text style={[styles.label, { fontFamily: fonts.bodySemi }]}>Descrição</Text>
          <TextInput
            placeholder="Regras e clima do grupo"
            placeholderTextColor={colors.onSurfaceVariant}
            value={description}
            onChangeText={setDescription}
            multiline
            style={[formTextInputStyle, styles.area, { fontFamily: fonts.body }]}
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
              <Text style={[styles.label, { fontFamily: fonts.bodySemi }]}>Entrada por participante (R$)</Text>
              <TextInput
                placeholder="50,00"
                placeholderTextColor={colors.onSurfaceVariant}
                keyboardType="decimal-pad"
                value={fee}
                onChangeText={setFee}
                style={[formTextInputStyle, { fontFamily: fonts.body }]}
              />
            </>
          ) : null}

          <Text style={[styles.label, { fontFamily: fonts.bodySemi }]}>Duração (dias)</Text>
          <TextInput
            keyboardType="number-pad"
            value={duration}
            onChangeText={setDuration}
            style={[formTextInputStyle, { fontFamily: fonts.body }]}
          />

          <Text style={[styles.label, { fontFamily: fonts.bodySemi }]}>Máx. participantes</Text>
          <TextInput
            keyboardType="number-pad"
            value={maxP}
            onChangeText={setMaxP}
            style={[formTextInputStyle, { fontFamily: fonts.body }]}
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

          <PrimaryButton title="Criar comunidade" onPress={submit} loading={loading} style={styles.submitBtn} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.xxl,
  },
  title: { fontSize: 26, color: colors.primary },
  hint: { color: colors.onSurfaceVariant, marginTop: spacing.sm, marginBottom: spacing.md },
  label: { color: colors.onSurface, marginTop: spacing.md, marginBottom: spacing.xs },
  area: { minHeight: 88, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  col: { marginTop: spacing.sm },
  submitBtn: { marginTop: spacing.lg },
});
