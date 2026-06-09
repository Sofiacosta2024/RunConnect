"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const callbackPath = searchParams.get("next") ?? "/entrenamientos";

  const onContinueWithGoogle = async () => {
    const callbackURL = typeof window !== "undefined"
      ? `${window.location.origin}${callbackPath}`
      : callbackPath;

    await authClient.signIn.social({
      provider: "google",
      callbackURL,
    });
  };

  const registrationHref = callbackPath === "/"
    ? "/registro"
    : `/registro?next=${encodeURIComponent(callbackPath)}`;
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <div className="grid w-full max-w-6xl gap-8 lg:grid-cols-[360px_1fr]">
        <main className="flex w-full flex-col gap-6 rounded-2xl border border-foreground/10 bg-background px-8 py-10 text-center sm:text-left">
          <div>
            <h1 className="text-3xl font-semibold leading-10 tracking-tight">
              Iniciar sesión
            </h1>
            <p className="mt-2 text-base leading-6 text-foreground/70">
              Usá tu cuenta de Google para continuar.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void onContinueWithGoogle()}
            className="flex h-12 w-full items-center justify-center rounded-full bg-foreground px-5 text-background transition-opacity hover:opacity-90"
          >
            Continuar con Google
          </button>

          <p className="text-sm text-foreground/70">
            ¿No tenés cuenta?{" "}
            <Link
              className="font-medium underline"
              href={registrationHref}
            >
              Registrate
            </Link>
          </p>
        </main>

        <aside className="hidden overflow-hidden rounded-[28px] border border-foreground/10 bg-[#0A0A0F] p-8 text-left text-foreground shadow-xl shadow-black/20 lg:block">
          <div className="relative overflow-hidden rounded-[28px] border border-white/5 bg-[#111118] p-8">
            <div className="absolute inset-x-0 top-0 h-48 bg-[radial-gradient(circle_at_top,rgba(255,60,60,0.12),transparent_70%)]" />
            <div className="relative">
              <div
                className="text-5xl font-black leading-tight"
                style={{
                  fontFamily: 'Bebas Neue, sans-serif',
                  backgroundImage: 'linear-gradient(135deg, #FF3C3C 0%, #FF7A00 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                RunConnect
              </div>
              <p className="mt-4 max-w-[24rem] text-sm leading-6 text-foreground/70">
                La comunidad de running y ciclismo más grande de tu ciudad a solo un click.
              </p>

              <div className="mt-8 rounded-3xl border border-white/5 bg-white/5 p-6">
                <div className="text-xs uppercase tracking-[0.28em] text-[#FF9C5C]">Muro en vivo</div>
                <div className="mt-4 text-2xl font-semibold text-foreground">Cada km cuenta</div>
                <p className="mt-3 text-sm leading-6 text-foreground/70">
                  Comparte tus entrenamientos, desafiate y conectá con corredores y ciclistas de tu alrededor.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
