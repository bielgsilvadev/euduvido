import { Screen } from '@/components/ui/Screen';
import { colors, fonts, screenPaddingX, spacing } from '@/constants/theme';
import { Link, Stack } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Página não encontrada', headerShown: true }} />
      <Screen edges={['bottom']}>
        <Text style={[styles.title, { fontFamily: fonts.bodyBold }]}>Esta página não existe.</Text>
        <Text style={[styles.sub, { fontFamily: fonts.body }]}>
          O link pode estar desatualizado ou este conteúdo não está mais disponível.
        </Text>
        <Link href="/" asChild>
          <Pressable style={styles.btn} accessibilityRole="link" accessibilityLabel="Ir ao início">
            <Text style={[styles.btnTxt, { fontFamily: fonts.bodySemi }]}>Voltar ao início</Text>
          </Pressable>
        </Link>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 20, color: colors.text, marginBottom: spacing.sm, paddingHorizontal: screenPaddingX },
  sub: {
    fontSize: 15,
    color: colors.textMuted,
    lineHeight: 22,
    marginBottom: spacing.lg,
    paddingHorizontal: screenPaddingX,
  },
  btn: { paddingHorizontal: screenPaddingX, paddingVertical: spacing.sm },
  btnTxt: { color: colors.accent, fontSize: 16 },
});
