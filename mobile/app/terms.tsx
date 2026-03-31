import { Screen } from '@/components/ui/Screen';
import { colors, fonts, screenPaddingX, spacing } from '@/constants/theme';
import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function TermsScreen() {
  return (
    <Screen edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Link href="/" asChild>
          <Pressable hitSlop={8}>
            <Text style={[styles.back, { fontFamily: fonts.bodySemi }]}>← Início</Text>
          </Pressable>
        </Link>
        <Text style={[styles.h1, { fontFamily: fonts.display }]} accessibilityRole="header">
          Termos de uso
        </Text>
        <Text style={[styles.meta, { fontFamily: fonts.body }]}>Última atualização: 29 de março de 2026 · Eu Duvido!</Text>

        <Section title="1. O que é o Eu Duvido!">
          Plataforma de desafios pessoais com aposta em dinheiro real, fiscalização por juízes ou comunidade, reações
          (Eu Acredito! / Eu Duvido!) e destino definido para o valor caso o criador falhe (ex.: caridade, amigo ou
          rival). Pagamentos e escrow são processados por parceiros certificados (ex.: Stripe), conforme a lei e as
          regras das lojas de aplicativos.
        </Section>
        <Section title="2. Conteúdo e conduta">
          Você é responsável pelo que publica (provas, comentários, metas). É proibido fraude, manipulação de provas,
          assédio, discurso de ódio, conteúdo ilegal ou que viole direitos de terceiros. Podemos remover conteúdo e
          suspender contas que violem estes termos ou coloquem em risco a integridade dos desafios.
        </Section>
        <Section title="3. Saúde, finanças e decisões pessoais">
          Desafios podem envolver hábitos de saúde ou esforço físico: o app não substitui orientação médica ou
          profissional. Apostas envolvem risco financeiro — use apenas valores que pode perder. Leia sempre as regras
          do desafio e do método de pagamento antes de confirmar.
        </Section>
        <Section title="4. Apostas, taxas e parceiros de pagamento">
          Valores travados, liberação em caso de sucesso, captura ou repasse em caso de falha e eventuais taxas da
          plataforma seguem o que estiver descrito no fluxo de pagamento e nas políticas do provedor (ex.: Stripe).
          Alterações materiais serão comunicadas por meios razoáveis. Compras in-app nas lojas Apple/Google seguem as
          regras dessas lojas; valide com assessoria jurídica se o seu caso exigir.
        </Section>
        <Section title="5. Reputação, ranking e regras do jogo">
          Pontuação, reputação e penalidades exibidas no app têm fins de engajamento e transparência entre
          usuários. As regras podem evoluir com aviso razoável. Tentativas de fraude ou burla a juízes/desafios podem
          resultar em desqualificação e medidas na conta.
        </Section>
        <Section title="6. Limitação de responsabilidade">
          O serviço é fornecido &quot;como está&quot;. Na medida permitida pela lei, não nos responsabilizamos por
          danos indiretos, lucros cessantes ou perdas decorrentes do uso do app ou de decisões de terceiros (juízes,
          comunidade, ONGs ou destinatários de valores).
        </Section>
        <Section title="7. Contato">
          Dúvidas sobre estes termos: substitua por um e-mail ou canal de suporte oficial antes da produção.
        </Section>

        <Text style={[styles.footnote, { fontFamily: fonts.body }]}>
          Modelo informativo — revise com advogado antes do lançamento comercial e de fluxos com dinheiro real.
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
