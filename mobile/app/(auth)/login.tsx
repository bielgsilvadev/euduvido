import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { colors, fonts, radii, spacing } from '@/constants/theme';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { Link } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isSupabaseConfigured) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={[styles.title, { fontFamily: fonts.display }]}>DryLeague</Text>
          <Text style={[styles.hint, { fontFamily: fonts.body }]}>
            Configure EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY no arquivo .env ou em
            app.json → expo.extra.
          </Text>
        </View>
      </Screen>
    );
  }

  async function signIn() {
    if (!email.trim() || !password) {
      Alert.alert('Campos obrigatórios', 'Preencha e-mail e senha.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (error) Alert.alert('Não foi possível entrar', error.message);
  }

  return (
    <Screen padded={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <View style={styles.pad}>
          <Text style={[styles.brand, { fontFamily: fonts.display }]} accessibilityRole="header">
            DryLeague
          </Text>
          <Text style={[styles.sub, { fontFamily: fonts.body }]}>
            Treino validado. Pontos reais. Ligas privadas.
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
            placeholderTextColor={colors.onSurfaceVariant}
            value={email}
            onChangeText={setEmail}
            style={[styles.input, { fontFamily: fonts.body }]}
          />

          <Text style={[styles.label, { fontFamily: fonts.bodySemi }]} nativeID="login-pass-label">
            Senha
          </Text>
          <TextInput
            accessibilityLabelledBy="login-pass-label"
            secureTextEntry
            placeholder="••••••••"
            placeholderTextColor={colors.onSurfaceVariant}
            value={password}
            onChangeText={setPassword}
            style={[styles.input, { fontFamily: fonts.body }]}
          />

          <PrimaryButton title="Entrar" onPress={signIn} loading={loading} style={{ marginTop: spacing.lg }} />

          <Text style={[styles.oauthHint, { fontFamily: fonts.body }]}>Login social</Text>
          <PrimaryButton
            title="Continuar com Apple"
            variant="secondary"
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
  pad: { flex: 1, padding: spacing.lg, paddingTop: spacing.xxl, justifyContent: 'center' },
  brand: { fontSize: 40, color: colors.primary, letterSpacing: -1 },
  sub: { color: colors.onSurfaceVariant, marginTop: spacing.sm, marginBottom: spacing.xl, fontSize: 15 },
  label: { color: colors.onSurface, marginBottom: spacing.xs, marginTop: spacing.md },
  input: {
    backgroundColor: colors.surfaceLowest,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    color: colors.onSurface,
    fontSize: 16,
    minHeight: 52,
  },
  row: { flexDirection: 'row', marginTop: spacing.lg, flexWrap: 'wrap' },
  muted: { color: colors.onSurfaceVariant },
  link: { color: colors.primary },
  center: { flex: 1, justifyContent: 'center', padding: spacing.lg },
  title: { fontSize: 32, color: colors.primary, textAlign: 'center' },
  hint: { color: colors.onSurfaceVariant, textAlign: 'center', marginTop: spacing.md, lineHeight: 22 },
  oauthHint: { color: colors.onSurfaceVariant, marginTop: spacing.lg, fontSize: 13 },
});
