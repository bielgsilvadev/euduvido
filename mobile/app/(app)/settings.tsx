import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { colors, fonts, radii, spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { logAlcohol } from '@/lib/api';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

const TERMS_URL = process.env.EXPO_PUBLIC_LEGAL_TERMS_URL ?? 'https://dryleague.vercel.app/terms';
const PRIVACY_URL = process.env.EXPO_PUBLIC_LEGAL_PRIVACY_URL ?? 'https://dryleague.vercel.app/privacy';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [alcoholNote, setAlcoholNote] = useState('');
  const [busy, setBusy] = useState(false);

  async function onAlcohol() {
    if (!user) return;
    setBusy(true);
    const err = await logAlcohol(user.id, alcoholNote.trim() || undefined);
    setBusy(false);
    if (err) Alert.alert('Registro', err);
    else {
      setAlcoholNote('');
      Alert.alert('Registrado', '−15 pontos aplicados (honestidade conta).');
    }
  }

  return (
    <Screen>
      <Text style={[styles.section, { fontFamily: fonts.display }]}>Conta</Text>
      <PrimaryButton title="Sair" variant="danger" onPress={() => signOut().then(() => router.replace('/'))} />

      <Text style={[styles.section, { fontFamily: fonts.display }]}>Álcool</Text>
      <Text style={[styles.p, { fontFamily: fonts.body }]}>
        Transparência total: registrar consumo aplica penalidade de −15 pontos (ajustável por liga no backend).
      </Text>
      <TextInput
        placeholder="Nota opcional (ex.: social, 1 cerveja)"
        placeholderTextColor={colors.onSurfaceVariant}
        value={alcoholNote}
        onChangeText={setAlcoholNote}
        style={[styles.input, { fontFamily: fonts.body }]}
      />
      <PrimaryButton title="Registrar consumo" onPress={onAlcohol} loading={busy} variant="secondary" />

      <Text style={[styles.section, { fontFamily: fonts.display }]}>Legal</Text>
      <Pressable onPress={() => Linking.openURL(TERMS_URL)} style={styles.linkRow}>
        <Text style={[styles.link, { fontFamily: fonts.bodySemi }]}>Termos de uso</Text>
      </Pressable>
      <Pressable onPress={() => Linking.openURL(PRIVACY_URL)} style={styles.linkRow}>
        <Text style={[styles.link, { fontFamily: fonts.bodySemi }]}>Política de privacidade</Text>
      </Pressable>

      <Text style={[styles.section, { fontFamily: fonts.display }]}>Retenção</Text>
      <Text style={[styles.p, { fontFamily: fonts.body }]}>
        Ative lembretes nas configurações do sistema. Resumo semanal e alertas de inatividade podem ser
        enviados via Supabase Edge Functions + push (configure EXPO_PUBLIC_PROJECT_ID e credenciais).
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { fontSize: 20, color: colors.primary, marginTop: spacing.xl, marginBottom: spacing.sm },
  p: { color: colors.onSurfaceVariant, lineHeight: 22, marginBottom: spacing.sm },
  input: {
    backgroundColor: colors.surfaceLowest,
    borderRadius: radii.md,
    padding: spacing.md,
    color: colors.onSurface,
    marginBottom: spacing.sm,
  },
  linkRow: { paddingVertical: spacing.sm },
  link: { color: colors.tertiary, fontSize: 16 },
});
