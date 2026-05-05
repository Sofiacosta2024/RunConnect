"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { authClient } from "@/lib/auth-client";

export default function RegisterPage() {
  const searchParams = useSearchParams();
  const callbackURL = searchParams.get("next") ?? "/";

  const onContinueWithGoogle = async () => {
    await authClient.signIn.social({
      provider: "google",
      callbackURL,
    });
  };

  const loginHref = callbackURL === "/"
    ? "/login"
    : `/login?next=${encodeURIComponent(callbackURL)}`;

  return (
    <div className="flex flex-1 items-center justify-center bg-background px-6 text-foreground">
      <main className="flex w-full max-w-md flex-col gap-6 rounded-2xl border border-foreground/10 bg-background px-8 py-10 text-center sm:text-left">
        <div>
          <h1 className="text-3xl font-semibold leading-10 tracking-tight">
            Crear cuenta
          </h1>
          <p className="mt-2 text-base leading-6 text-foreground/70">
            El registro es únicamente con Google.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void onContinueWithGoogle()}
          className="flex h-12 w-full items-center justify-center rounded-full bg-foreground px-5 text-background transition-opacity hover:opacity-90"
        >
          Registrarse con Google
        </button>

        <p className="text-sm text-foreground/70">
          ¿Ya tenés cuenta?{" "}
          <Link
            className="font-medium underline"
            href={loginHref}
          >
            Iniciá sesión
          </Link>
        </p>
      </main>
    </div>
  );
}
