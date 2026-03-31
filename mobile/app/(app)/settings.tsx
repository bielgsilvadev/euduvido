import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { colors, fonts, screenPaddingX, spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { legalPrivacyUrl, legalTermsUrl } from '@/lib/legalUrls';
import { Link, useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { Pressable, StyleSheet, Text } from 'react-native';

export default function SettingsScreen() {
  const router = useRouter();
  const { signOut } = useAuth();

  return (
    <Screen edges={['bottom']} belowNativeHeader>
      <Text style={[styles.section, { fontFamily: fonts.display }]}>Conta</Text>
      <Text style={[styles.p, { fontFamily: fonts.body }]}>
        Eu Duvido! — desafios sociais com aposta real. Ajustes finos de notificações e privacidade chegam nas
        próximas versões.
      </Text>

      <Text style={[styles.subSection, { fontFamily: fonts.bodySemi }]}>Legal</Text>
      <Pressable onPress={() => Linking.openURL(legalTermsUrl())} style={styles.linkRow}>
        <Text style={[styles.link, { fontFamily: fonts.body }]}>Termos de uso</Text>
      </Pressable>
      <Pressable onPress={() => Linking.openURL(legalPrivacyUrl())} style={styles.linkRow}>
        <Text style={[styles.link, { fontFamily: fonts.body }]}>Política de privacidade</Text>
      </Pressable>

      <Text style={[styles.subSection, { fontFamily: fonts.bodySemi }]}>Sessão</Text>
      <Text style={[styles.p, { fontFamily: fonts.body }]}>Sair encerra a sessão neste dispositivo.</Text>
      <PrimaryButton title="Sair" variant="danger" onPress={() => signOut().then(() => router.replace('/'))} />

      <Link href="/" asChild>
        <Pressable style={{ marginTop: spacing.lg }}>
          <Text style={[styles.backHome, { fontFamily: fonts.body }]}>← Voltar ao app</Text>
        </Pressable>
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { fontSize: 20, color: colors.primary, marginBottom: spacing.sm },
  subSection: { fontSize: 15, color: colors.text, marginTop: spacing.lg, marginBottom: spacing.sm },
  p: { color: colors.onSurfaceVariant, lineHeight: 22, marginBottom: spacing.md },
  linkRow: { paddingVertical: spacing.sm, paddingHorizontal: screenPaddingX },
  link: { color: colors.accent, fontSize: 16 },
  backHome: { color: colors.textMuted, fontSize: 14 },
});
