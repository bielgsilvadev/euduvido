import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { colors, fonts, formTextInputStyle, radii, screenPaddingX, spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { createChallenge } from '@/lib/challengesApi';
import { notifyError, notifySuccess } from '@/lib/notify';
import { uploadChallengeCover } from '@/lib/uploadChallengeCover';
import type { PayoutDestination } from '@/types/models';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Linking from 'expo-linking';
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { addDays, formatISO } from 'date-fns';
import { useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CATEGORIES = [
  { key: 'previsao', label: 'Previsão' },
  { key: 'comportamento', label: 'Comportamento' },
  { key: 'opiniao', label: 'Opinião' },
  { key: 'esporte', label: 'Esporte' },
  { key: 'trabalho', label: 'Trabalho' },
  { key: 'geral', label: 'Geral' },
] as const;
const PAYOUT_OPTIONS: Array<{ key: PayoutDestination; label: string; hint: string }> = [
  { key: 'winner', label: 'Vencedor', hint: 'Quem vencer recebe o pote (menos 10% da plataforma).' },
  {
    key: 'developers',
    label: 'Desenvolvedores',
    hint: 'Em caso de derrota, a tua parte reforça a equipa que constrói o Eu Duvido! (menos taxa da plataforma).',
  },
];

export default function CreateChallengeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, refreshProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]['key']>('geral');
  const [betAmount, setBetAmount] = useState('50');
  const [durationDays, setDurationDays] = useState('30');
  const [openChallenge, setOpenChallenge] = useState(false);
  const [challengedUsername, setChallengedUsername] = useState('');
  const [arbiterUsername, setArbiterUsername] = useState('');
  const [payoutDestination, setPayoutDestination] = useState<PayoutDestination>('winner');
  const [paymentMode, setPaymentMode] = useState<'social' | 'stripe'>('social');
  const [coverLocalUri, setCoverLocalUri] = useState<string | null>(null);
  const [challengeRules, setChallengeRules] = useState('');
  const [proofRequirements, setProofRequirements] = useState('');
  const [startDate] = useState(() => new Date());
  const [proofType, setProofType] = useState<'photo' | 'checkin'>('photo');
  const [proofFrequency, setProofFrequency] = useState<'daily' | 'weekly' | 'once_at_end'>('daily');
  const [isPublic, setIsPublic] = useState(true);
  const stripeEnabled = process.env.EXPO_PUBLIC_STRIPE_ENABLED !== 'false';

  const progressDots = [1, 2, 3, 4, 5].map((s) => (s <= step ? '●' : '○')).join(' ');

  async function pickCoverImage() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      notifyError('Permite acesso às fotos para definir uma capa.', 'Capa do desafio');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      ...(Platform.OS !== 'web' ? { allowsEditing: true, aspect: [16, 9] as [number, number] } : {}),
    });
    if (!res.canceled && res.assets[0]) setCoverLocalUri(res.assets[0].uri);
  }

  async function publish() {
    if (!user?.id) return;
    const amount = parseFloat(betAmount.replace(',', '.'));
    const days = parseInt(durationDays, 10);
    if (!title.trim() || Number.isNaN(amount) || amount < 1) {
      notifyError('Preencha título e um valor de aposta válido.', 'Desafio');
      return;
    }
    if (!Number.isFinite(days) || days < 1 || days > 365) {
      notifyError('Defina um prazo entre 1 e 365 dias.', 'Prazo');
      return;
    }
    if (!openChallenge && !challengedUsername.trim()) {
      notifyError('Informe o @usuário desafiado ou marque como aposta aberta.', 'Duelo');
      return;
    }
    setBusy(true);
    const endDate = addDays(startDate, days);
    let coverImageUrl: string | null = null;
    if (coverLocalUri) {
      coverImageUrl = await uploadChallengeCover(user.id, coverLocalUri);
      if (!coverImageUrl) {
        setBusy(false);
        notifyError('Não foi possível enviar a capa. Tente novamente.', 'Upload');
        return;
      }
    }

    const stripeFn = process.env.EXPO_PUBLIC_STRIPE_CHALLENGE_FN?.trim() || null;
    const { id, error, warning, checkout_url } = await createChallenge(user.id, {
      title,
      description,
      category,
      bet_amount: amount,
      payout_destination: payoutDestination,
      payment_mode: paymentMode,
      open_challenge: openChallenge,
      challenged_username: challengedUsername,
      arbiter_username: arbiterUsername,
      start_date: formatISO(startDate),
      end_date: formatISO(endDate),
      proof_type: proofType,
      proof_frequency: proofFrequency,
      challenge_rules: challengeRules,
      proof_requirements: proofRequirements,
      is_public: isPublic,
      status: 'active',
      cover_image_url: coverImageUrl,
      stripe_function_name: stripeFn,
    });
    setBusy(false);
    if (!id) {
      notifyError(error ?? 'Não foi possível criar o desafio.', 'Eu Duvido!');
      return;
    }
    if (error) {
      notifyError(error, 'Convites');
    }
    if (warning) {
      notifyError(warning, 'Stripe');
    }
    notifySuccess('Duelo criado! Convites do desafiado e árbitro foram registrados.', 'Eu Duvido!');
    await refreshProfile();
    if (checkout_url) {
      try {
        await Linking.openURL(checkout_url);
      } catch {
        notifyError('Checkout Stripe criado, mas falhou ao abrir o link.', 'Stripe');
      }
    }
    router.replace(`/(app)/challenge/${id}` as Href);
  }

  return (
    <Screen padded={false} edges={['top']}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Fechar" hitSlop={12}>
          <Ionicons name="close" size={28} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { fontFamily: fonts.bodyBold }]}>Criar desafio</Text>
        <View style={{ width: 28 }} />
      </View>
      <Text style={[styles.progress, { fontFamily: fonts.body }]}>{progressDots}</Text>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: screenPaddingX,
          paddingBottom: insets.bottom + spacing.xl,
        }}
        keyboardShouldPersistTaps="handled">
        {step === 1 && (
          <View style={styles.block}>
            <Text style={[styles.label, { fontFamily: fonts.bodySemi }]}>Capa do desafio (opcional)</Text>
            <Pressable style={styles.coverPicker} onPress={pickCoverImage}>
              {coverLocalUri ? (
                <Image source={{ uri: coverLocalUri }} style={styles.coverImg} contentFit="cover" />
              ) : (
                <View style={styles.coverEmpty}>
                  <Ionicons name="image-outline" size={28} color={colors.textMuted} />
                  <Text style={[styles.coverTxt, { fontFamily: fonts.body }]}>Selecionar imagem 16:9</Text>
                </View>
              )}
            </Pressable>
            {coverLocalUri ? (
              <Pressable style={styles.coverRemove} onPress={() => setCoverLocalUri(null)}>
                <Text style={[styles.coverRemoveTxt, { fontFamily: fonts.bodySemi }]}>Remover capa</Text>
              </Pressable>
            ) : null}
            <Text style={[styles.label, { fontFamily: fonts.bodySemi }]}>Qual é o desafio?</Text>
            <TextInput
              style={[formTextInputStyle, styles.multiline, { fontFamily: fonts.body }]}
              placeholder="Ex: Aposto R$50 que o dólar passa de R$6 até sexta"
              placeholderTextColor={colors.textMuted}
              value={title}
              onChangeText={setTitle}
              multiline
              maxLength={280}
            />
            <Text style={[styles.counter, { fontFamily: fonts.body }]}>{title.length}/280</Text>
            <Text style={[styles.label, { fontFamily: fonts.bodySemi }]}>Categoria</Text>
            <View style={styles.catGrid}>
              {CATEGORIES.map((c) => (
                <Pressable
                  key={c.key}
                  onPress={() => setCategory(c.key)}
                  style={[styles.catChip, category === c.key && styles.catChipOn]}>
                  <Text
                    style={[
                      styles.catTxt,
                      { fontFamily: fonts.bodySemi },
                      category === c.key && styles.catTxtOn,
                    ]}>
                    {c.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={[styles.label, { fontFamily: fonts.bodySemi }]}>Descrição (opcional)</Text>
            <TextInput
              style={[formTextInputStyle, styles.multiline, { fontFamily: fonts.body, minHeight: 80 }]}
              placeholder="Regras extras, contexto..."
              placeholderTextColor={colors.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
            />
            <Text style={[styles.label, { fontFamily: fonts.bodySemi }]}>Regras rápidas (opcional)</Text>
            <TextInput
              style={[formTextInputStyle, { fontFamily: fonts.body }]}
              placeholder="Ex: só vale até 23:59, sem edição posterior."
              placeholderTextColor={colors.textMuted}
              value={challengeRules}
              onChangeText={setChallengeRules}
            />
          </View>
        )}

        {step === 2 && (
          <View style={styles.block}>
            <Text style={[styles.label, { fontFamily: fonts.bodyBold }]}>Valor da aposta (R$)</Text>
            <Text style={[styles.hint, { fontFamily: fonts.body }]}>Define o valor por lado e como o pagamento funciona.</Text>
            <TextInput
              style={[formTextInputStyle, { fontFamily: fonts.body }]}
              keyboardType="decimal-pad"
              value={betAmount}
              onChangeText={setBetAmount}
            />
            <Text style={[styles.label, { fontFamily: fonts.bodySemi }]}>Prazo (dias)</Text>
            <TextInput
              style={[formTextInputStyle, { fontFamily: fonts.body }]}
              keyboardType="number-pad"
              value={durationDays}
              onChangeText={setDurationDays}
            />
            <Text style={[styles.label, { fontFamily: fonts.bodySemi }]}>Destino do dinheiro se você perder</Text>
            {PAYOUT_OPTIONS.map((opt) => (
              <Pressable
                key={opt.key}
                style={[styles.destCard, payoutDestination === opt.key && styles.destCardOn]}
                onPress={() => setPayoutDestination(opt.key)}>
                <Text style={[styles.destTxt, { fontFamily: fonts.bodySemi }]}>{opt.label}</Text>
                <Text style={[styles.destHint, { fontFamily: fonts.body }]}>{opt.hint}</Text>
              </Pressable>
            ))}
            <Text style={[styles.label, { fontFamily: fonts.bodySemi }]}>Pagamento</Text>
            <Pressable
              style={[styles.destCard, paymentMode === 'social' && styles.destCardOn]}
              onPress={() => setPaymentMode('social')}>
              <Text style={[styles.destTxt, { fontFamily: fonts.bodySemi }]}>Social (sem cobrança automática)</Text>
              <Text style={[styles.destHint, { fontFamily: fonts.body }]}>
                O valor fica apenas registado no duelo; liquidação é combinada entre participantes.
              </Text>
            </Pressable>
            <Pressable
              style={[styles.destCard, paymentMode === 'stripe' && styles.destCardOn, !stripeEnabled && styles.destCardDisabled]}
              onPress={() => {
                if (!stripeEnabled) return;
                setPaymentMode('stripe');
              }}>
              <Text style={[styles.destTxt, { fontFamily: fonts.bodySemi }]}>Stripe (checkout + escrow)</Text>
              <Text style={[styles.destHint, { fontFamily: fonts.body }]}>
                Cria sessão de pagamento após publicar. Requer Edge Function configurada no Supabase.
              </Text>
            </Pressable>
            {!stripeEnabled ? (
              <Text style={[styles.hint, { fontFamily: fonts.body }]}>
                Stripe desativado no app (`EXPO_PUBLIC_STRIPE_ENABLED=false`).
              </Text>
            ) : null}
          </View>
        )}

        {step === 3 && (
          <View style={styles.block}>
            <Text style={[styles.label, { fontFamily: fonts.bodySemi }]}>Provas</Text>
            <Text style={[styles.hint, { fontFamily: fonts.body }]}>
              Prazo padrão: começa hoje e termina em 30 dias. Use prova diária para hábitos e prova final para previsões/opiniões.
            </Text>
            <Pressable
              style={[styles.destCard, proofType === 'photo' && styles.destCardOn]}
              onPress={() => setProofType('photo')}>
              <Text style={[styles.destTxt, { fontFamily: fonts.bodySemi }]}>📸 Foto</Text>
            </Pressable>
            <Pressable
              style={[styles.destCard, proofType === 'checkin' && styles.destCardOn]}
              onPress={() => setProofType('checkin')}>
              <Text style={[styles.destTxt, { fontFamily: fonts.bodySemi }]}>✅ Check-in</Text>
            </Pressable>
            <Text style={[styles.sub, { fontFamily: fonts.bodySemi }]}>Frequência</Text>
            {(['daily', 'weekly', 'once_at_end'] as const).map((f) => (
              <Pressable
                key={f}
                style={[styles.destCard, proofFrequency === f && styles.destCardOn]}
                onPress={() => setProofFrequency(f)}>
                <Text style={[styles.destTxt, { fontFamily: fonts.body }]}>
                  {f === 'daily' ? 'Diária (hábito)' : f === 'weekly' ? 'Semanal' : 'Só no resultado final'}
                </Text>
              </Pressable>
            ))}
            <Text style={[styles.label, { fontFamily: fonts.bodySemi }]}>Requisitos da prova (opcional)</Text>
            <TextInput
              style={[formTextInputStyle, styles.multiline, { fontFamily: fonts.body, minHeight: 84 }]}
              placeholder="Ex: selfie no local + print de horário / geolocalização"
              placeholderTextColor={colors.textMuted}
              value={proofRequirements}
              onChangeText={setProofRequirements}
              multiline
            />
          </View>
        )}

        {step === 4 && (
          <View style={styles.block}>
            <Text style={[styles.label, { fontFamily: fonts.bodySemi }]}>Participantes</Text>
            <Text style={[styles.hint, { fontFamily: fonts.body }]}>
              Defina quem você quer desafiar e quem arbitra o resultado. O árbitro deve ser uma terceira pessoa.
            </Text>
            <Pressable style={styles.rowToggle} onPress={() => setOpenChallenge((x) => !x)}>
              <Text style={[styles.destTxt, { fontFamily: fonts.body }]}>
                {openChallenge ? '🌍 Aposta aberta (qualquer pessoa pode aceitar)' : '👤 Aposta direta (desafio por @username)'}
              </Text>
            </Pressable>
            {!openChallenge ? (
              <>
                <Text style={[styles.label, { fontFamily: fonts.bodySemi }]}>@Desafiado</Text>
                <TextInput
                  autoCapitalize="none"
                  style={[formTextInputStyle, { fontFamily: fonts.body }]}
                  placeholder="@usuario"
                  placeholderTextColor={colors.textMuted}
                  value={challengedUsername}
                  onChangeText={setChallengedUsername}
                />
              </>
            ) : null}
            <Text style={[styles.label, { fontFamily: fonts.bodySemi }]}>@Árbitro (opcional)</Text>
            <TextInput
              autoCapitalize="none"
              style={[formTextInputStyle, { fontFamily: fonts.body }]}
              placeholder="@arbitro"
              placeholderTextColor={colors.textMuted}
              value={arbiterUsername}
              onChangeText={setArbiterUsername}
            />
          </View>
        )}

        {step === 5 && (
          <View style={styles.block}>
            <Text style={[styles.label, { fontFamily: fonts.bodyBold }]}>Revisão</Text>
            <Text style={[styles.review, { fontFamily: fonts.body }]}>🎯 {title || '—'}</Text>
            <Text style={[styles.review, { fontFamily: fonts.body }]}>
              💰 R$ {betAmount} por lado · Destino se perder: {PAYOUT_OPTIONS.find((x) => x.key === payoutDestination)?.label}
            </Text>
            <Text style={[styles.review, { fontFamily: fonts.body }]}>
              💳 {paymentMode === 'stripe' ? 'Stripe / checkout' : 'Social (sem cobrança automática)'} · ⏱️ {durationDays} dias
            </Text>
            <Text style={[styles.review, { fontFamily: fonts.body }]}>
              📸 {proofType} · {proofFrequency}
            </Text>
            {coverLocalUri ? (
              <Text style={[styles.review, { fontFamily: fonts.body }]}>🖼️ Capa definida</Text>
            ) : null}
            {challengeRules.trim() ? (
              <Text style={[styles.review, { fontFamily: fonts.body }]}>📜 Regras: {challengeRules.trim()}</Text>
            ) : null}
            {proofRequirements.trim() ? (
              <Text style={[styles.review, { fontFamily: fonts.body }]}>🧪 Prova: {proofRequirements.trim()}</Text>
            ) : null}
            <Text style={[styles.review, { fontFamily: fonts.body }]}>
              ⚔️ {openChallenge ? 'Aposta aberta' : `Desafiado: ${challengedUsername || '—'}`} · Árbitro:{' '}
              {arbiterUsername || 'não definido'}
            </Text>
            <Text style={[styles.hint, { fontFamily: fonts.body }]}>
              Taxa da plataforma: 10% sobre o valor em disputa quando o duelo for resolvido.
            </Text>
            <Pressable style={styles.rowToggle} onPress={() => setIsPublic(!isPublic)}>
              <Text style={[styles.destTxt, { fontFamily: fonts.body }]}>
                {isPublic ? '🌍 Público no feed' : '🔒 Menos visível (ajuste fino na v1.1)'}
              </Text>
            </Pressable>
          </View>
        )}

        <View style={styles.navRow}>
          {step > 1 ? (
            <PrimaryButton title="Voltar" variant="ghost" onPress={() => setStep((s) => s - 1)} style={styles.half} />
          ) : (
            <View style={styles.half} />
          )}
          {step < 5 ? (
            <PrimaryButton title="Próximo" onPress={() => setStep((s) => s + 1)} style={styles.half} />
          ) : (
            <PrimaryButton title="Publicar" onPress={publish} loading={busy} style={styles.half} />
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: screenPaddingX,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headerTitle: { fontSize: 17, color: colors.text },
  progress: { textAlign: 'center', color: colors.textMuted, paddingVertical: spacing.sm },
  block: { gap: spacing.sm, paddingTop: spacing.md },
  label: { color: colors.text, fontSize: 15, marginTop: spacing.sm },
  sub: { color: colors.textMuted, fontSize: 13, marginTop: spacing.sm },
  hint: { color: colors.textMuted, fontSize: 13, lineHeight: 18 },
  multiline: { minHeight: 100, textAlignVertical: 'top' },
  counter: { color: colors.textMuted, fontSize: 12, alignSelf: 'flex-end' },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.md,
    backgroundColor: colors.bgCardAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  catChipOn: { borderColor: colors.accent, backgroundColor: colors.accentGlow },
  catTxt: { color: colors.textSecondary, fontSize: 13, textTransform: 'capitalize' },
  catTxtOn: { color: colors.accent },
  destCard: {
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgCard,
    marginBottom: 8,
  },
  destCardOn: { borderColor: colors.accent, backgroundColor: colors.accentGlow },
  destCardDisabled: { opacity: 0.45 },
  destTxt: { color: colors.text, fontSize: 15 },
  destHint: { color: colors.textMuted, fontSize: 12, marginTop: 4, lineHeight: 16 },
  coverPicker: {
    borderRadius: radii.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgCardAlt,
  },
  coverImg: { width: '100%', aspectRatio: 16 / 9 },
  coverEmpty: {
    width: '100%',
    aspectRatio: 16 / 9,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  coverTxt: { color: colors.textMuted, fontSize: 13 },
  coverRemove: { alignSelf: 'flex-start', paddingVertical: 6, paddingHorizontal: 10, borderRadius: radii.pill },
  coverRemoveTxt: { color: colors.red, fontSize: 12 },
  review: { color: colors.text, fontSize: 15, marginBottom: 6 },
  rowToggle: { padding: spacing.md, borderRadius: radii.md, backgroundColor: colors.bgCardAlt },
  navRow: { flexDirection: 'row', gap: 12, marginTop: spacing.lg },
  half: { flex: 1 },
});
