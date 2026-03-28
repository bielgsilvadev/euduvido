import Link from "next/link";

export const metadata = {
  title: "Termos de uso — DryLeague",
};

export default function TermsPage() {
  return (
    <article className="min-h-dvh px-6 py-16 max-w-2xl mx-auto text-dl-muted leading-relaxed">
      <Link href="/" className="text-dl-primary text-sm hover:underline">
        ← Início
      </Link>
      <h1 className="mt-8 text-dl-text font-[family-name:var(--font-display)] text-3xl font-bold">
        Termos de uso
      </h1>
      <p className="mt-2 text-sm">Última atualização: 28 de março de 2026</p>

      <section className="mt-10 space-y-4">
        <h2 className="text-dl-text font-semibold text-lg">1. Serviço</h2>
        <p>
          O DryLeague é um aplicativo social de condicionamento físico gamificado. Você pode registrar treinos
          com foto e descrição, acompanhar pontuação, participar de ligas privadas e, quando aplicável,
          competições com taxas de entrada administradas conforme a legislação vigente e políticas das lojas
          de aplicativos.
        </p>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-dl-text font-semibold text-lg">2. Conteúdo e conduta</h2>
        <p>
          Você é responsável pelo conteúdo que publica. É proibido fraude, assédio, discurso de ódio,
          conteúdo ilegal ou que viole direitos de terceiros. Reservamo-nos o direito de remover conteúdo e
          suspender contas que violem estes termos.
        </p>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-dl-text font-semibold text-lg">3. Saúde e segurança</h2>
        <p>
          O app não substitui orientação médica. Pratique atividades físicas por sua conta e risco. Em caso de
          dúvida, consulte um profissional de saúde.
        </p>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-dl-text font-semibold text-lg">4. Ligas pagas e prêmios</h2>
        <p>
          Quando disponível, taxas de entrada e distribuição de prêmios seguem as regras definidas pelo criador
          da liga no momento do início, sem alteração retroativa. Pagamentos devem ser processados por
          provedores seguros (ex.: Stripe). A Apple pode exigir uso de compras no app para certos conteúdos
          digitais; avalie conforme a categoria do seu produto com assessoria jurídica.
        </p>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-dl-text font-semibold text-lg">5. Pontuação e penalidades</h2>
        <p>
          Regras de pontos, streaks e penalidades (ex.: inatividade, registro de álcool) são descritas no app
          e podem evoluir com aviso razoável. O sistema busca integridade competitiva; tentativas de fraude
          podem resultar em desqualificação.
        </p>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-dl-text font-semibold text-lg">6. Limitação de responsabilidade</h2>
        <p>
          O serviço é fornecido &quot;como está&quot;. Na medida permitida pela lei, não nos responsabilizamos por
          danos indiretos, lucros cessantes ou perdas decorrentes do uso do app.
        </p>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-dl-text font-semibold text-lg">7. Contato</h2>
        <p>
          Dúvidas sobre estes termos: substitua por um e-mail de suporte real antes da publicação em produção.
        </p>
      </section>

      <p className="mt-12 text-xs opacity-70">
        Modelo informativo — revise com advogado antes do lançamento comercial.
      </p>
    </article>
  );
}
