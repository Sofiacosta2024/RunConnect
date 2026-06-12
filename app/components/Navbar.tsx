"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [session, setSession] = useState<null | { user: { email?: string; name?: string } }>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      try {
        const response = await fetch("/api/auth/get-session", { cache: "no-store" });
        if (!isMounted) return;

        if (response.ok) {
          const data = await response.json();
          setSession(data);
        } else {
          setSession(null);
        }
      } catch {
        setSession(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/login";
  };

  return (
    <nav className="rc-nav">
      <div className="rc-logo">
        Run<span>Connect</span>
      </div>

      <ul className="rc-nav-links">
        <li><Link href="/">Muro</Link></li>
        <li><Link href="/entrenamientos">Entrenamientos</Link></li>
        <li> <Link href="/mis-entrenamientos">Mis entrenamientos</Link></li>
        <li> <Link href="/solicitudes">Solicitudes</Link></li>
        {!loading && (
          session ? (
            <>
              <li><Link href="/perfil">Mi perfil</Link></li>
              <li>
                <button type="button" onClick={handleLogout}>
                  Cerrar sesión
                </button>
              </li>
            </>
          ) : (
            <li>
              <Link className="rc-nav-button" href="/login">
                Iniciar sesión
              </Link>
            </li>
          )
        )}     
     </ul>
    </nav>
  );
}