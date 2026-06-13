"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();
  const [session, setSession] = useState<null | { user: { email?: string; name?: string } }>(null);
  const [loading, setLoading] = useState(true);
  const [noLeidas, setNoLeidas] = useState(0);
  const [esAdmin, setEsAdmin] = useState(false);

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

  useEffect(() => {
    if (!session) {
      setEsAdmin(false);
      return;
    }
    fetch("/api/user-role", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setEsAdmin(data.rol === "admin"))
      .catch(() => setEsAdmin(false));
  }, [session]);

  useEffect(() => {
    if (!session) return;
    const cargarNoLeidas = async () => {
      try {
        const res = await fetch("/api/notificaciones");
        if (res.ok) {
          const data = await res.json();
          setNoLeidas(data.noLeidas ?? 0);
        }
      } catch {
        // ignore
      }
    };
    cargarNoLeidas();
    const intervalo = setInterval(cargarNoLeidas, 15000);
    return () => clearInterval(intervalo);
  }, [session]);

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
        <li><Link href="/" className={pathname === "/" ? "active" : ""}>Muro</Link></li>
        <li><Link href="/entrenamientos" className={pathname.startsWith("/entrenamientos") ? "active" : ""}>Entrenamientos</Link></li>
        <li> <Link href="/mis-entrenamientos" className={pathname.startsWith("/mis-entrenamientos") ? "active" : ""}>Mis entrenamientos</Link></li>
        <li> <Link href="/solicitudes" className={pathname.startsWith("/solicitudes") ? "active" : ""}>Solicitudes</Link></li>
        {!loading && (
          session ? (
            <>
              <li style={{ position: "relative" }}>
                <Link href="/notificaciones" className={pathname.startsWith("/notificaciones") ? "active" : ""} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  🔔
                  {noLeidas > 0 && (
                    <span style={{
                      background: "#FF3C3C",
                      color: "#fff",
                      fontSize: 10,
                      fontWeight: 700,
                      borderRadius: "50%",
                      width: 18,
                      height: 18,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "absolute",
                      top: -6,
                      right: -10,
                    }}>
                      {noLeidas > 9 ? "9+" : noLeidas}
                    </span>
                  )}
                </Link>
              </li>
              <li><Link href="/perfil" className={pathname.startsWith("/perfil") ? "active" : ""}>Mi perfil</Link></li>
              {esAdmin && (
                <li><Link href="/admin" className={pathname.startsWith("/admin") ? "active" : ""} style={{ color: "var(--rc-accent)" }}>Admin</Link></li>
              )}
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