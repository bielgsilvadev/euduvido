import { BrandLogo } from '@/components/BrandLogo';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { colors, fonts, formTextInputStyle, screenPaddingX, spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { formatAuthSignInError } from '@/lib/authErrors';
import { notifyError } from '@/lib/notify';
import { isSupabaseConfigured, supabase, SUPABASE_ENV_MISSING_HINT } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/');
    }
  }, [authLoading, user, router]);

  if (!isSupabaseConfigured) {
    return (
      <Screen>
        <View style={styles.center}>
          <BrandLogo maxWidth={260} style={{ marginBottom: spacing.lg }} />
          <Text style={[styles.hint, { fontFamily: fonts.body }]}>{SUPABASE_ENV_MISSING_HINT}</Text>
        </View>
      </Screen>
    );
  }

  async function signIn() {
    if (!email.trim() || !password) {
      notifyError('Preencha e-mail e senha.', 'Campos obrigatórios');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        const text = formatAuthSignInError(error);
        queueMicrotask(() => notifyError(text, 'Não foi possível entrar'));
        return;
      }
      router.replace('/');
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      queueMicrotask(() => notifyError(msg || 'Falha de rede ou tempo esgotado.', 'Não foi possível entrar'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen padded={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <View style={styles.pad}>
          <BrandLogo maxWidth={300} style={{ marginBottom: spacing.md }} />
          <Text style={[styles.sub, { fontFamily: fonts.body }]}>
            Entre para ver desafios, apostas em jogo e quem na comunidade acredita em você — ou duvida.
          </Text>

          <Text style={[styles.label, { fontFamily: fonts.bodySemi }]} nativeID="login-email-label">
            E-mail
          </Text>
          <TextInput
            accessibilityLabelledBy="login-email-label"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            placeholder="voce@email.com"
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={setEmail}
            style={[formTextInputStyle, { fontFamily: fonts.body, minHeight: 52 }]}
          />

          <Text style={[styles.label, { fontFamily: fonts.bodySemi }]} nativeID="login-pass-label">
            Senha
          </Text>
          <TextInput
            accessibilityLabelledBy="login-pass-label"
            secureTextEntry
            placeholder="••••••••"
            placeholderTextColor={colors.textMuted}
            value={password}
            onChangeText={setPassword}
            returnKeyType="go"
            onSubmitEditing={signIn}
            style={[formTextInputStyle, { fontFamily: fonts.body, minHeight: 52 }]}
          />

          <PrimaryButton title="Entrar" onPress={signIn} loading={loading} style={{ marginTop: spacing.lg }} />

          <View style={styles.forgotRow}>
            <Link href="/(auth)/forgot-password" asChild>
              <Pressable accessibilityRole="link" hitSlop={8}>
                <Text style={[styles.link, { fontFamily: fonts.bodySemi }]}>Esqueci a senha</Text>
              </Pressable>
            </Link>
          </View>

          <Text style={[styles.oauthHint, { fontFamily: fonts.body }]}>Login social</Text>
          <PrimaryButton
            title="Continuar com Apple"
            variant="secondary"
            leftIcon={<Ionicons name="logo-apple" size={22} color={colors.onPrimary} />}
            onPress={() =>
              Alert.alert(
                'Apple Sign In',
                'Configure o provedor Apple no painel do Supabase (Authentication → Providers) e adicione o fluxo nativo com expo-apple-authentication.',
              )
            }
            style={{ marginTop: spacing.sm }}
          />
          <PrimaryButton
            title="Continuar com Google"
            variant="ghost"
            leftIcon={<Ionicons name="logo-google" size={22} color={colors.text} />}
            onPress={() =>
              Alert.alert(
                'Google',
                'Habilite Google OAuth no Supabase e use expo-auth-session + WebBrowser (redirect URI autorizado).',
              )
            }
            style={{ marginTop: spacing.sm }}
          />

          <View style={styles.row}>
            <Text style={[styles.muted, { fontFamily: fonts.body }]}>Novo por aqui? </Text>
            <Link href="/(auth)/register" asChild>
              <Pressable accessibilityRole="link" hitSlop={8}>
                <Text style={[styles.link, { fontFamily: fonts.bodySemi }]}>Criar conta</Text>
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
  pad: { flex: 1, paddingHorizontal: screenPaddingX, paddingVertical: spacing.lg, justifyContent: 'center' },
  sub: { color: colors.textMuted, marginBottom: spacing.xl, fontSize: 15 },
  label: { color: colors.text, marginBottom: spacing.xs, marginTop: spacing.md },
  row: { flexDirection: 'row', marginTop: spacing.lg, flexWrap: 'wrap' },
  forgotRow: { marginTop: spacing.md, alignItems: 'flex-end' },
  muted: { color: colors.textMuted },
  link: { color: colors.accent },
  center: { flex: 1, justifyContent: 'center', paddingHorizontal: screenPaddingX, paddingVertical: spacing.lg },
  hint: { color: colors.textMuted, textAlign: 'center', lineHeight: 22 },
  oauthHint: { color: colors.textMuted, marginTop: spacing.lg, fontSize: 13 },
});
