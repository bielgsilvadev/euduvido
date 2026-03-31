import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-dvh px-6 py-16 max-w-xl mx-auto">
      <Image
        src="/logo.png"
        alt="Eu Duvido!"
        width={360}
        height={108}
        className="w-full max-w-sm h-auto"
        priority
      />
      <h1 className="mt-4 text-dl-text font-[family-name:var(--font-display)] text-2xl font-semibold">
        Documentos legais do Eu Duvido!
      </h1>
      <p className="mt-4 text-dl-muted leading-relaxed">
        Este site hospeda os documentos exigidos para revisão das lojas e para o onboarding do app mobile. O
        produto principal é o aplicativo de apostas P2P sociais.
      </p>
      <ul className="mt-10 space-y-4">
        <li>
          <Link
            href="/terms"
            className="text-dl-gold underline underline-offset-4 hover:text-dl-primary transition-colors"
          >
            Termos de uso
          </Link>
        </li>
        <li>
          <Link
            href="/privacy"
            className="text-dl-gold underline underline-offset-4 hover:text-dl-primary transition-colors"
          >
            Política de privacidade
          </Link>
        </li>
      </ul>
    </div>
  );
}
