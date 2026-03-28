import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { colors, fonts, radii, spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { Link, useRouter } from 'expo-router';
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

export default function RegisterScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function signUp() {
    if (username.trim().length < 3) {
      Alert.alert('Username', 'Use pelo menos 3 caracteres no nome de usuário.');
      return;
    }
    if (!email.trim() || password.length < 6) {
      Alert.alert('Dados inválidos', 'E-mail válido e senha com no mínimo 6 caracteres.');
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          username: username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_'),
          display_name: displayName.trim() || username.trim(),
        },
      },
    });
    setLoading(false);
    if (error) {
      Alert.alert('Cadastro', error.message);
      return;
    }
    if (data.session) {
      router.replace('/');
      return;
    }
    Alert.alert(
      'Confirme seu e-mail',
      'Enviamos um link de confirmação. Após confirmar, faça login.',
      [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }],
    );
  }

  return (
    <Screen padded={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <View style={styles.pad}>
          <Text style={[styles.title, { fontFamily: fonts.display }]}>Criar conta</Text>
          <Text style={[styles.sub, { fontFamily: fonts.body }]}>
            Participe de ligas, registre treinos com foto e dispute o ranking.
          </Text>

          <Text style={[styles.label, { fontFamily: fonts.bodySemi }]} nativeID="reg-user-label">
            Usuário
          </Text>
          <TextInput
            accessibilityLabelledBy="reg-user-label"
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="atleta_iron"
            placeholderTextColor={colors.onSurfaceVariant}
            value={username}
            onChangeText={setUsername}
            style={[styles.input, { fontFamily: fonts.body }]}
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
            style={[styles.input, { fontFamily: fonts.body }]}
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
            style={[styles.input, { fontFamily: fonts.body }]}
          />

          <Text style={[styles.label, { fontFamily: fonts.bodySemi }]} nativeID="reg-pass-label">
            Senha
          </Text>
          <TextInput
            accessibilityLabelledBy="reg-pass-label"
            secureTextEntry
            placeholder="Mínimo 6 caracteres"
            placeholderTextColor={colors.onSurfaceVariant}
            value={password}
            onChangeText={setPassword}
            style={[styles.input, { fontFamily: fonts.body }]}
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
  pad: { flex: 1, padding: spacing.lg, paddingTop: spacing.lg },
  title: { fontSize: 28, color: colors.onSurface },
  sub: { color: colors.onSurfaceVariant, marginTop: spacing.sm, marginBottom: spacing.md },
  label: { color: colors.onSurface, marginBottom: spacing.xs, marginTop: spacing.sm },
  input: {
    backgroundColor: colors.surfaceLowest,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    color: colors.onSurface,
    fontSize: 16,
    minHeight: 52,
  },
  row: { flexDirection: 'row', marginTop: spacing.lg },
  muted: { color: colors.onSurfaceVariant },
  link: { color: colors.primary },
});
