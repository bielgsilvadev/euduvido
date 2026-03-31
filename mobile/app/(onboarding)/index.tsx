import { BrandLogo } from '@/components/BrandLogo';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { colors, fonts, radii, screenPaddingX, spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { legalPrivacyUrl, legalTermsUrl } from '@/lib/legalUrls';
import { notifyError } from '@/lib/notify';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const INFO_STEPS = [
  {
    icon: 'flash-outline' as const,
    title: 'Duelo entre pessoas reais',
    body: 'Crie uma aposta sobre qualquer tema: esporte, comportamento, previsão, opinião ou desafio do dia a dia.',
  },
  {
    icon: 'cash-outline' as const,
    title: 'Dinheiro em disputa',
    body: 'Cada lado define o valor da aposta. O montante fica em escrow até a resolução e a plataforma retém 10% do valor final.',
  },
  {
    icon: 'shield-checkmark-outline' as const,
    title: 'Árbitro + comunidade',
    body: 'O árbitro escolhido decide o resultado e a comunidade acompanha com comentários, torcida e ranking de credibilidade.',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();

  const [step, setStep] = useState(0);
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function complete() {
    if (!accepted) {
      const msg = 'Aceite os termos e a política de privacidade para continuar.';
      if (Platform.OS === 'web') {
        queueMicrotask(() => notifyError(msg, 'Termos'));
      } else {
        Alert.alert('Termos', msg);
      }
      return;
    }
    if (!user?.id) {
      queueMicrotask(() => notifyError('Sessão inválida. Volte ao login e entre de novo.', 'Eu Duvido!'));
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user.id)
        .select('id')
        .maybeSingle();

      if (error) {
        queueMicrotask(() =>
          notifyError(
            error.message || 'Não foi possível guardar. Confirme as permissões (RLS) da tabela profiles no Supabase.',
            'Erro',
          ),
        );
        return;
      }
      if (!data) {
        queueMicrotask(() =>
          notifyError(
            'Nenhuma linha foi atualizada. Confirme se o perfil existe e se está autenticado.',
            'Perfil',
          ),
        );
        return;
      }

      await refreshProfile();
      router.replace('/');
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      queueMicrotask(() => notifyError(msg || 'Erro inesperado.', 'Eu Duvido!'));
    } finally {
      setLoading(false);
    }
  }

  function goTerms() {
    setStep(INFO_STEPS.length);
  }

  if (step < INFO_STEPS.length) {
    const s = INFO_STEPS[step];
    return (
      <Screen edges={['top', 'bottom']}>
        <View style={styles.infoWrap}>
          <View style={styles.infoCenter}>
            <Ionicons name={s.icon} size={80} color={colors.accent} style={styles.stepIcon} />
            <Text
              accessibilityRole="header"
              style={[styles.stepTitle, { fontFamily: fonts.display }]}
              numberOfLines={3}>
              {s.title}
            </Text>
            <Text style={[styles.stepBody, { fontFamily: fonts.body }]}>{s.body}</Text>
          </View>
          <View style={styles.dots}>
            {INFO_STEPS.map((_, i) => (
              <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
            ))}
          </View>
          <View style={styles.infoActions}>
            {step < INFO_STEPS.length - 1 ? (
              <PrimaryButton title="Próximo" onPress={() => setStep((x) => x + 1)} />
            ) : (
              <PrimaryButton title="Continuar" onPress={goTerms} />
            )}
            <Pressable onPress={goTerms} style={styles.skipBtn} hitSlop={12}>
              <Text style={[styles.skipTxt, { fontFamily: fonts.body }]}>Pular</Text>
            </Pressable>
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen padded={false} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.termsScroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.termsInner}>
          <BrandLogo maxWidth={200} style={styles.termsLogo} />
          <Text style={[styles.termsHeadline, { fontFamily: fonts.display }]} accessibilityRole="header">
            Quase lá
          </Text>
          <Text style={[styles.body, { fontFamily: fonts.body }]}>
            Para usar o Eu Duvido!, confirme que leu e aceita os documentos legais abaixo.
          </Text>

          <Pressable
            onPress={() => setAccepted(!accepted)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: accepted }}
            style={styles.checkCard}
            hitSlop={8}>
            <View style={[styles.box, accepted && styles.boxOn]}>
              {accepted ? (
                <Ionicons name="checkmark" size={18} color={colors.onPrimary} accessibilityLabel="" />
              ) : null}
            </View>
            <Text style={[styles.checkLabel, { fontFamily: fonts.body }]}>
              Li e aceito os{' '}
              <Text
                style={styles.link}
                onPress={(e) => {
                  e?.stopPropagation?.();
                  Linking.openURL(legalTermsUrl());
                }}
                accessibilityRole="link">
                Termos de uso
              </Text>{' '}
              e a{' '}
              <Text
                style={styles.link}
                onPress={(e) => {
                  e?.stopPropagation?.();
                  Linking.openURL(legalPrivacyUrl());
                }}
                accessibilityRole="link">
                Política de privacidade
              </Text>
              .
            </Text>
          </Pressable>

          <PrimaryButton title="Começar" onPress={complete} loading={loading} style={styles.termsButton} />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  infoWrap: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: spacing.xl,
  },
  infoCenter: { alignItems: 'center', paddingHorizontal: screenPaddingX },
  stepIcon: { marginBottom: spacing.lg },
  stepTitle: {
    fontSize: 36,
    lineHeight: 42,
    textAlign: 'center',
    letterSpacing: 0.5,
    color: colors.accent,
    marginBottom: spacing.md,
    maxWidth: 320,
  },
  stepBody: {
    color: colors.onSurfaceVariant,
    fontSize: 16,
    lineHeight: 26,
    textAlign: 'center',
    maxWidth: 300,
  },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginVertical: spacing.lg },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border },
  dotActive: { width: 20, backgroundColor: colors.accent },
  infoActions: { gap: spacing.sm, paddingHorizontal: screenPaddingX },
  skipBtn: { paddingVertical: spacing.sm, alignItems: 'center' },
  skipTxt: { color: colors.textMuted, fontSize: 15 },
  termsScroll: {
    flexGrow: 1,
    paddingHorizontal: screenPaddingX,
    paddingBottom: spacing.xl,
    justifyContent: 'center',
  },
  termsInner: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  termsLogo: {
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  termsHeadline: {
    fontSize: 32,
    color: colors.primary,
    marginBottom: spacing.sm,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  body: {
    color: 'rgba(240,240,242,0.9)',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  checkCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceHigh,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  box: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.surfaceLowest,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  boxOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkLabel: { flex: 1, color: colors.onSurface, lineHeight: 22 },
  link: { color: colors.primary, textDecorationLine: 'underline' },
  termsButton: { marginTop: spacing.lg },
});
