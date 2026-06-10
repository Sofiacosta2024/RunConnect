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
    <div className="rc-root rc-auth-page">
      <div className="rc-auth-grid">
        <main className="rc-auth-card">
          <div>
            <h1 className="rc-auth-title">Iniciar sesión</h1>
            <p className="rc-auth-subtitle">Usá tu cuenta de Google para continuar.</p>
          </div>

          <button
            type="button"
            onClick={() => void onContinueWithGoogle()}
            className="rc-btn-primary rc-auth-btn"
          >
            Continuar con Google
          </button>

          <p className="rc-auth-footer">
            ¿No tenés cuenta?{" "}
            <Link className="rc-auth-link" href={registrationHref}>
              Registrate
            </Link>
          </p>
        </main>

        <aside className="rc-auth-aside">
          <div className="rc-auth-aside-inner">
            <div className="rc-auth-aside-glow" />
            <div className="rc-auth-aside-content">
              <div className="rc-logo" style={{ fontSize: 48 }}>RunConnect</div>
              <p className="rc-auth-aside-sub">
                La comunidad de running y ciclismo más grande de tu ciudad a solo un click.
              </p>
              <div className="rc-auth-aside-box">
                <div className="rc-auth-aside-tag">Muro en vivo</div>
                <div className="rc-auth-aside-heading">Cada km cuenta</div>
                <p className="rc-auth-aside-desc">
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