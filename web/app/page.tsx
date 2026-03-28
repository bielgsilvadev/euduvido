import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-dvh px-6 py-16 max-w-xl mx-auto">
      <p className="text-dl-primary font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">
        DryLeague
      </p>
      <h1 className="mt-4 text-dl-text font-[family-name:var(--font-display)] text-2xl font-semibold">
        Páginas legais e suporte à App Store
      </h1>
      <p className="mt-4 text-dl-muted leading-relaxed">
        Este site hospeda os documentos exigidos para revisão da Apple e para o fluxo de onboarding do app
        mobile (Expo). O produto principal é o aplicativo iOS/Android.
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
