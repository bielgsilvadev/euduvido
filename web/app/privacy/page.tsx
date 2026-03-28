import Link from "next/link";

export const metadata = {
  title: "Política de privacidade — DryLeague",
};

export default function PrivacyPage() {
  return (
    <article className="min-h-dvh px-6 py-16 max-w-2xl mx-auto text-dl-muted leading-relaxed">
      <Link href="/" className="text-dl-primary text-sm hover:underline">
        ← Início
      </Link>
      <h1 className="mt-8 text-dl-text font-[family-name:var(--font-display)] text-3xl font-bold">
        Política de privacidade
      </h1>
      <p className="mt-2 text-sm">Última atualização: 28 de março de 2026</p>

      <section className="mt-10 space-y-4">
        <h2 className="text-dl-text font-semibold text-lg">1. Dados que coletamos</h2>
        <p>
          Conta (e-mail, nome de usuário), conteúdo que você publica (fotos de treino, descrições, comentários),
          dados de uso do app, identificadores de dispositivo para notificações push quando você optar por
          recebê-las, e dados necessários ao processamento de pagamentos quando você participar de ligas pagas.
        </p>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-dl-text font-semibold text-lg">2. Finalidades</h2>
        <p>
          Prestação do serviço, autenticação, feeds sociais, ranking e ligas, prevenção a fraude, cumprimento
          legal, melhoria do produto e comunicações operacionais (ex.: alertas de inatividade, se habilitados).
        </p>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-dl-text font-semibold text-lg">3. Base legal (LGPD)</h2>
        <p>
          Execução de contrato, legítimo interesse (segurança e melhoria do serviço), consentimento quando
          exigido (ex.: notificações marketing, se aplicável) e obrigação legal.
        </p>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-dl-text font-semibold text-lg">4. Compartilhamento</h2>
        <p>
          Utilizamos provedores de infraestrutura (ex.: Supabase para banco, auth e armazenamento de imagens;
          Vercel para páginas web legais). Dados públicos do feed podem ser vistos por outros usuários conforme
          as configurações de visibilidade escolhidas.
        </p>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-dl-text font-semibold text-lg">5. Retenção</h2>
        <p>
          Mantemos os dados enquanto sua conta estiver ativa ou conforme necessário para obrigações legais.
          Você pode solicitar exclusão da conta conforme fluxo no app ou suporte.
        </p>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-dl-text font-semibold text-lg">6. Seus direitos</h2>
        <p>
          Acesso, correção, portabilidade, eliminação, informação sobre compartilhamento e revogação de
          consentimento, nos termos da LGPD. Entre em contato pelo canal oficial indicado no app.
        </p>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-dl-text font-semibold text-lg">7. Crianças</h2>
        <p>O serviço não é destinado a menores de 13 anos (ou idade mínima local). Não coletamos dados sabendo serem de menores.</p>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-dl-text font-semibold text-lg">8. Alterações</h2>
        <p>
          Podemos atualizar esta política. Notificaremos por meios razoáveis (ex.: aviso no app) quando houver
          mudança material.
        </p>
      </section>

      <p className="mt-12 text-xs opacity-70">
        Modelo informativo — adapte com assessoria jurídica e lista real de subprocessadores antes do
        lançamento.
      </p>
    </article>
  );
}
