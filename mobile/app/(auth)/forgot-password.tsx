import { BrandLogo } from '@/components/BrandLogo';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { colors, fonts, formTextInputStyle, screenPaddingX, spacing } from '@/constants/theme';
import { formatAuthPasswordResetError } from '@/lib/authErrors';
import { getAuthRedirectUrl } from '@/lib/authRedirect';
import { notifyError, notifyInfo } from '@/lib/notify';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { Link } from 'expo-router';
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

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isSupabaseConfigured) {
    return (
      <Screen edges={['bottom']} belowNativeHeader>
        <View style={styles.center}>
          <Text style={[styles.hint, { fontFamily: fonts.body }]}>
            Configure EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY no .env.
          </Text>
        </View>
      </Screen>
    );
  }

  async function sendReset() {
    const trimmed = email.trim();
    if (!trimmed) {
      notifyError('Indique o e-mail da sua conta.', 'Campo obrigatório');
      return;
    }
    const redirectTo = getAuthRedirectUrl('/');
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
      ...(redirectTo ? { redirectTo } : {}),
    });
    setLoading(false);
    if (error) {
      const text = formatAuthPasswordResetError(error);
      queueMicrotask(() => notifyError(text, 'Recuperação'));
      return;
    }
    queueMicrotask(() =>
      notifyInfo(
        'Se existir conta com este e-mail, receberá um link para redefinir a senha. Verifique também o spam.',
        'E-mail enviado',
      ),
    );
  }

  return (
    <Screen edges={['bottom']} belowNativeHeader padded={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <View style={styles.pad}>
          <BrandLogo maxWidth={280} style={{ marginBottom: spacing.md }} />
          <Text style={[styles.sub, { fontFamily: fonts.body }]}>
            Recuperação de acesso ao Eu Duvido! — enviaremos um link para o e-mail da conta, se existir.
          </Text>

          <Text style={[styles.label, { fontFamily: fonts.bodySemi }]} nativeID="forgot-email-label">
            E-mail
          </Text>
          <TextInput
            accessibilityLabelledBy="forgot-email-label"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            placeholder="voce@email.com"
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={setEmail}
            style={[formTextInputStyle, { fontFamily: fonts.body, minHeight: 52 }]}
          />

          <PrimaryButton title="Enviar link" onPress={sendReset} loading={loading} style={{ marginTop: spacing.lg }} />

          <View style={styles.row}>
            <Link href="/(auth)/login" asChild>
              <Pressable accessibilityRole="link" hitSlop={8}>
                <Text style={[styles.link, { fontFamily: fonts.bodySemi }]}>Voltar ao login</Text>
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
  sub: { color: colors.textMuted, marginBottom: spacing.xl, fontSize: 15, lineHeight: 22 },
  label: { color: colors.text, marginBottom: spacing.xs, marginTop: spacing.md },
  row: { marginTop: spacing.lg },
  link: { color: colors.accent },
  center: { flex: 1, justifyContent: 'center', paddingHorizontal: screenPaddingX, paddingVertical: spacing.lg },
  hint: { color: colors.textMuted, textAlign: 'center', lineHeight: 22 },
});
