import { Screen } from '@/components/ui/Screen';
import { colors, fonts, screenPaddingX, spacing } from '@/constants/theme';
import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function PrivacyScreen() {
  return (
    <Screen edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Link href="/" asChild>
          <Pressable hitSlop={8}>
            <Text style={[styles.back, { fontFamily: fonts.bodySemi }]}>← Início</Text>
          </Pressable>
        </Link>
        <Text style={[styles.h1, { fontFamily: fonts.display }]} accessibilityRole="header">
          Política de privacidade
        </Text>
        <Text style={[styles.meta, { fontFamily: fonts.body }]}>Última atualização: 29 de março de 2026 · Eu Duvido!</Text>

        <Section title="1. Dados que coletamos">
          Conta (e-mail, nome de usuário, perfil), conteúdo que você publica em desafios (fotos ou vídeos de prova,
          descrições, comentários, reações), dados de uso do app, tokens de notificação push se você autorizar, e
          dados necessários a pagamentos e escrow (ex.: identificadores de transação via Stripe) quando você cria ou
          entra em desafios com aposta.
        </Section>
        <Section title="2. Finalidades">
          Prestação do serviço (feed, desafios, juízes, ranking e reputação), autenticação, prevenção a fraude,
          cumprimento legal, processamento de pagamentos, melhoria do produto e comunicações operacionais (ex.:
          lembretes de prova ou resultado de desafio).
        </Section>
        <Section title="3. Base legal (LGPD)">
          Execução de contrato, legítimo interesse (segurança e melhoria do serviço), consentimento quando exigido
          (ex.: notificações opcionais) e obrigação legal.
        </Section>
        <Section title="4. Compartilhamento">
          Infraestrutura em provedores como Supabase (auth, base de dados, armazenamento de mídia) e processadores
          de pagamento. Conteúdo marcado como público pode ser visto por outros usuários conforme as opções de cada
          desafio.
        </Section>
        <Section title="5. Retenção">
          Mantemos os dados enquanto a conta estiver ativa ou conforme exigido por lei ou por obrigações financeiras.
          Você pode pedir exclusão de conta conforme fluxo no app ou suporte.
        </Section>
        <Section title="6. Seus direitos">
          Acesso, correção, portabilidade, eliminação, informação sobre compartilhamento e revogação de consentimento,
          nos termos da LGPD. Use o canal oficial indicado no app.
        </Section>
        <Section title="7. Crianças">
          O serviço não é destinado a menores de 13 anos (ou idade mínima local). Não coletamos dados sabendo serem
          de menores.
        </Section>
        <Section title="8. Alterações">
          Podemos atualizar esta política e avisar por meios razoáveis (ex.: aviso no app) quando houver mudança
          material.
        </Section>

        <Text style={[styles.footnote, { fontFamily: fonts.body }]}>
          Modelo informativo — adapte com assessoria jurídica e lista real de subprocessadores antes do lançamento.
        </Text>
      </ScrollView>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: string }) {
  return (
    <View style={styles.section}>
      <Text style={[styles.h2, { fontFamily: fonts.bodySemi }]}>{title}</Text>
      <Text style={[styles.p, { fontFamily: fonts.body }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: screenPaddingX, paddingBottom: spacing.xxl, maxWidth: 640, alignSelf: 'center', width: '100%' },
  back: { color: colors.primary, fontSize: 14, marginBottom: spacing.md },
  h1: { color: colors.onSurface, fontSize: 32, letterSpacing: 0.5, marginBottom: spacing.xs },
  meta: { color: colors.onSurfaceVariant, fontSize: 14, marginBottom: spacing.lg },
  section: { marginTop: spacing.lg },
  h2: { color: colors.onSurface, fontSize: 17, marginBottom: spacing.sm },
  p: { color: colors.onSurfaceVariant, fontSize: 15, lineHeight: 24 },
  footnote: { color: colors.textMuted, fontSize: 12, marginTop: spacing.xl, opacity: 0.85 },
});
