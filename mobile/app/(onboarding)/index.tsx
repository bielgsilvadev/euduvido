import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { colors, fonts, spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

const TERMS_URL = process.env.EXPO_PUBLIC_LEGAL_TERMS_URL ?? 'https://dryleague.vercel.app/terms';
const PRIVACY_URL = process.env.EXPO_PUBLIC_LEGAL_PRIVACY_URL ?? 'https://dryleague.vercel.app/privacy';

export default function OnboardingScreen() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function complete() {
    if (!accepted) {
      Alert.alert('Termos', 'Aceite os termos e a política de privacidade para continuar.');
      return;
    }
    if (!user) return;
    setLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update({ onboarding_completed: true })
      .eq('id', user.id);
    setLoading(false);
    if (error) {
      Alert.alert('Erro', error.message);
      return;
    }
    await refreshProfile();
    router.replace('/');
  }

  return (
    <Screen>
      <Text style={[styles.headline, { fontFamily: fonts.display }]} accessibilityRole="header">
        Disciplina em alta voltagem
      </Text>
      <Text style={[styles.body, { fontFamily: fonts.body }]}>
        Cada treino validado com foto e descrição vale +1 ponto. Dias sem treino podem gerar penalidade
        (-2). Registrar consumo de álcool aplica -15 pontos (transparência total).
      </Text>
      <Text style={[styles.body, { fontFamily: fonts.body }]}>
        Ligas privadas: ranking grátis ou com taxa de entrada e pote — regras travadas após o início.
      </Text>

      <Pressable
        onPress={() => setAccepted(!accepted)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: accepted }}
        style={styles.checkRow}
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
            onPress={() => Linking.openURL(TERMS_URL)}
            accessibilityRole="link">
            Termos de uso
          </Text>{' '}
          e a{' '}
          <Text
            style={styles.link}
            onPress={() => Linking.openURL(PRIVACY_URL)}
            accessibilityRole="link">
            Política de privacidade
          </Text>
          .
        </Text>
      </Pressable>

      <PrimaryButton title="Começar" onPress={complete} loading={loading} style={{ marginTop: spacing.xl }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headline: {
    fontSize: 28,
    color: colors.primary,
    marginBottom: spacing.md,
    letterSpacing: -0.5,
  },
  body: {
    color: colors.onSurfaceVariant,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, marginTop: spacing.lg },
  box: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.surfaceLowest,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  boxOn: { backgroundColor: colors.primary },
  checkLabel: { flex: 1, color: colors.onSurface, lineHeight: 22 },
  link: { color: colors.primary, textDecorationLine: 'underline' },
});
