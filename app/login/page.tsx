"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const callbackURL = searchParams.get("next") ?? "/";

  const onContinueWithGoogle = async () => {
    await authClient.signIn.social({
      provider: "google",
      callbackURL,
    });
  };

  const registrationHref = callbackURL === "/"
    ? "/registro"
    : `/registro?next=${encodeURIComponent(callbackURL)}`;

  return (
    <div className="flex flex-1 items-center justify-center bg-background px-6 text-foreground">
      <main className="flex w-full max-w-md flex-col gap-6 rounded-2xl border border-foreground/10 bg-background px-8 py-10 text-center sm:text-left">
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
    </div>
  );
}
