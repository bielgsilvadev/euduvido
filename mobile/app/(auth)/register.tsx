import { BrandLogo } from '@/components/BrandLogo';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { colors, fonts, formTextInputStyle, screenPaddingX, spacing } from '@/constants/theme';
import { formatAuthSignUpError } from '@/lib/authErrors';
import { getAuthRedirectUrl } from '@/lib/authRedirect';
import { notifyError, notifyInfo } from '@/lib/notify';
import { supabase } from '@/lib/supabase';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const MIN_PASSWORD_LEN = 8;

function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
}

export default function RegisterScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function signUp() {
    const normalizedUser = normalizeUsername(username);
    if (normalizedUser.length < 3) {
      notifyError(
        'Use pelo menos 3 caracteres válidos (letras a–z, números ou _). Acentos e espaços viram sublinhado.',
        'Usuário',
      );
      return;
    }
    if (!email.trim() || password.length < MIN_PASSWORD_LEN) {
      notifyError(
        `E-mail válido e senha com no mínimo ${MIN_PASSWORD_LEN} caracteres (o Supabase costuma exigir 8).`,
        'Dados inválidos',
      );
      return;
    }
    const redirectTo = getAuthRedirectUrl('/');
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        ...(redirectTo ? { emailRedirectTo: redirectTo } : {}),
        data: {
          username: normalizedUser,
          display_name: displayName.trim() || username.trim(),
        },
      },
    });
    setLoading(false);
    if (error) {
      const text = formatAuthSignUpError(error, MIN_PASSWORD_LEN);
      queueMicrotask(() => notifyError(text, 'Cadastro'));
      return;
    }
    if (data.session) {
      router.replace('/');
      return;
    }
    notifyInfo(
      'Enviamos um link de confirmação. Após confirmar, faça login.',
      'Confirme seu e-mail',
      () => router.replace('/(auth)/login'),
    );
  }

  return (
    <Screen padded={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <View style={styles.pad}>
          <BrandLogo maxWidth={240} style={{ marginBottom: spacing.md }} />
          <Text style={[styles.title, { fontFamily: fonts.display }]}>Criar conta</Text>
          <Text style={[styles.sub, { fontFamily: fonts.body }]}>
            Crie desafios com aposta real, convide árbitros e prove à comunidade que cumpre a meta — ou o destino
            escolhido leva a aposta.
          </Text>

          <Text style={[styles.label, { fontFamily: fonts.bodySemi }]} nativeID="reg-user-label">
            Usuário
          </Text>
          <TextInput
            accessibilityLabelledBy="reg-user-label"
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="desafiante_2026"
            placeholderTextColor={colors.onSurfaceVariant}
            value={username}
            onChangeText={setUsername}
            style={[formTextInputStyle, { fontFamily: fonts.body, minHeight: 52 }]}
          />

          <Text style={[styles.label, { fontFamily: fonts.bodySemi }]} nativeID="reg-name-label">
            Nome exibido
          </Text>
          <TextInput
            accessibilityLabelledBy="reg-name-label"
            placeholder="Seu nome"
            placeholderTextColor={colors.onSurfaceVariant}
            value={displayName}
            onChangeText={setDisplayName}
            style={[formTextInputStyle, { fontFamily: fonts.body, minHeight: 52 }]}
          />

          <Text style={[styles.label, { fontFamily: fonts.bodySemi }]} nativeID="reg-email-label">
            E-mail
          </Text>
          <TextInput
            accessibilityLabelledBy="reg-email-label"
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="voce@email.com"
            placeholderTextColor={colors.onSurfaceVariant}
            value={email}
            onChangeText={setEmail}
            style={[formTextInputStyle, { fontFamily: fonts.body, minHeight: 52 }]}
          />

          <Text style={[styles.label, { fontFamily: fonts.bodySemi }]} nativeID="reg-pass-label">
            Senha
          </Text>
          <TextInput
            accessibilityLabelledBy="reg-pass-label"
            secureTextEntry
            placeholder={`Mínimo ${MIN_PASSWORD_LEN} caracteres`}
            placeholderTextColor={colors.onSurfaceVariant}
            value={password}
            onChangeText={setPassword}
            style={[formTextInputStyle, { fontFamily: fonts.body, minHeight: 52 }]}
          />

          <PrimaryButton title="Cadastrar" onPress={signUp} loading={loading} style={{ marginTop: spacing.lg }} />

          <View style={styles.row}>
            <Text style={[styles.muted, { fontFamily: fonts.body }]}>Já tem conta? </Text>
            <Link href="/(auth)/login" asChild>
              <Pressable accessibilityRole="link" hitSlop={8}>
                <Text style={[styles.link, { fontFamily: fonts.bodySemi }]}>Entrar</Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pad: { flex: 1, paddingHorizontal: screenPaddingX, paddingVertical: spacing.lg },
  title: { fontSize: 28, color: colors.onSurface },
  sub: { color: colors.onSurfaceVariant, marginTop: spacing.sm, marginBottom: spacing.md },
  label: { color: colors.onSurface, marginBottom: spacing.xs, marginTop: spacing.sm },
  row: { flexDirection: 'row', marginTop: spacing.lg },
  muted: { color: colors.onSurfaceVariant },
  link: { color: colors.primary },
});
