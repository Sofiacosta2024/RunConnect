"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import Pagination from "../components/Pagination";

type Notificacion = {
  codigoNotificacion: number;
  email: string;
  tipo: string;
  mensaje: string;
  codigoEntrenamiento: number | null;
  leida: number;
  creadoEn: string;
};

const LIMITE = 20;

export default function NotificacionesPage() {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [total, setTotal] = useState(0);
  const router = useRouter();

  useEffect(() => {
    cargarNotificaciones(pagina);
  }, [pagina]);

  async function cargarNotificaciones(p: number) {
    setCargando(true);
    try {
      const res = await fetch(`/api/notificaciones?pagina=${p}&limite=${LIMITE}`);
      if (!res.ok) {
        if (res.status === 401) router.push("/login");
        return;
      }
      const data = await res.json();
      setNotificaciones(data.notificaciones ?? []);
      setTotal(data.total ?? 0);
      setTotalPaginas(data.totalPaginas ?? 1);
    } catch {
      // ignore
    } finally {
      setCargando(false);
    }
  }

  async function marcarLeida(id: number) {
    await fetch(`/api/notificaciones/${id}`, { method: "PATCH" });
    setNotificaciones((prev) =>
      prev.map((n) =>
        n.codigoNotificacion === id ? { ...n, leida: 1 } : n
      )
    );
  }

  async function marcarTodasLeidas() {
    await fetch("/api/notificaciones", { method: "PATCH" });
    setNotificaciones((prev) =>
      prev.map((n) => ({ ...n, leida: 1 }))
    );
  }

  function irAChat(id: number | null) {
    if (id) router.push(`/chat/${id}`);
  }

  const noLeidasPagina = notificaciones.filter((n) => !n.leida).length;

  return (
    <div className="rc-root">
      <Navbar />
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "2rem 1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>
              Notificaciones
            </h1>
            <p style={{ color: "var(--rc-muted)", fontSize: "0.9rem", marginTop: "0.3rem" }}>
              {total > 0
                ? `${total} notificación${total !== 1 ? "es" : ""}`
                : "No hay notificaciones"}
            </p>
          </div>
          {total > 0 && (
            <button
              onClick={marcarTodasLeidas}
              style={{
                background: "rgba(255,60,60,0.1)",
                border: "1px solid rgba(255,60,60,0.2)",
                color: "#FF3C3C",
                padding: "8px 16px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Marcar todas leídas
            </button>
          )}
        </div>

        {cargando ? (
          <div style={{ textAlign: "center", padding: "3rem 0", color: "#7B7B8F" }}>
            Cargando notificaciones...
          </div>
        ) : notificaciones.length === 0 ? (
          <div
            className="rc-card"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.75rem",
              padding: "3rem 1rem",
              textAlign: "center",
            }}
          >
            <span style={{ fontSize: "2.5rem" }}>🔔</span>
            <h2 style={{ fontSize: "1rem", fontWeight: 600, margin: 0 }}>
              No tenés notificaciones
            </h2>
            <p style={{ color: "var(--rc-muted)", fontSize: "0.85rem", margin: 0 }}>
              Cuando recibas solicitudes o seas aceptado en un grupo, aparecerán acá.
            </p>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {notificaciones.map((n) => {
                const esNoLeida = !n.leida;
                const esAceptada = n.tipo === "solicitud_aceptada";
                return (
                  <div
                    key={n.codigoNotificacion}
                    onClick={() => {
                      if (esNoLeida) marcarLeida(n.codigoNotificacion);
                      if (esAceptada && n.codigoEntrenamiento) irAChat(n.codigoEntrenamiento);
                    }}
                    style={{
                      display: "flex",
                      gap: 12,
                      padding: "14px 16px",
                      borderRadius: 12,
                      background: esNoLeida
                        ? "rgba(255,60,60,0.06)"
                        : "transparent",
                      border: esNoLeida
                        ? "1px solid rgba(255,60,60,0.12)"
                        : "1px solid rgba(255,255,255,0.05)",
                      cursor: esAceptada ? "pointer" : "default",
                      transition: "background 0.2s",
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        background: esAceptada
                          ? "rgba(76, 217, 100, 0.12)"
                          : "rgba(255, 165, 0, 0.12)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 18,
                        flexShrink: 0,
                      }}
                    >
                      {esAceptada ? "✅" : "📩"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 14,
                          fontWeight: esNoLeida ? 600 : 400,
                          color: "#F0EFF5",
                        }}
                      >
                        {n.mensaje}
                      </p>
                      <p
                        style={{
                          margin: "4px 0 0",
                          fontSize: 12,
                          color: "#7B7B8F",
                        }}
                      >
                        {new Date(n.creadoEn).toLocaleDateString("es-AR", {
                          day: "numeric",
                          month: "long",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    {esNoLeida && (
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: "#FF3C3C",
                          flexShrink: 0,
                          marginTop: 6,
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
            {totalPaginas > 1 && (
              <Pagination pagina={pagina} totalPaginas={totalPaginas} onCambio={setPagina} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
