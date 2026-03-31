import Link from "next/link";

export const metadata = {
  title: "Termos de uso — Eu Duvido!",
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
          O Eu Duvido! é uma plataforma social de apostas P2P entre pessoas reais. Usuários podem criar duelos
          sobre previsões, comportamento, opiniões e desafios, definir valores, escolher árbitro e acompanhar
          o resultado com participação da comunidade.
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
        <h2 className="text-dl-text font-semibold text-lg">3. Dinheiro real e responsabilidade</h2>
        <p>
          Apostas envolvem risco financeiro. Use apenas valores que você pode perder. O app não é casa de apostas:
          as regras de cada duelo são definidas pelos próprios participantes e registradas no momento da criação.
        </p>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-dl-text font-semibold text-lg">4. Escrow, taxas e pagamentos</h2>
        <p>
          Quando disponível, os valores podem ficar travados em escrow até a resolução do duelo. Pagamentos devem
          ser processados por provedores seguros (ex.: Stripe). A plataforma pode aplicar taxa sobre o valor em
          disputa, conforme informado no fluxo de criação da aposta.
        </p>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-dl-text font-semibold text-lg">5. Reputação, ranking e penalidades</h2>
        <p>
          Regras de reputação, ranking e penalidades são descritas no app e podem evoluir com aviso razoável.
          Tentativas de fraude, manipulação de provas ou abuso do sistema podem resultar em desqualificação.
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
