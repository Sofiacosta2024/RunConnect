"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { PerfilData } from "./actions";
import { actualizarPerfil } from "./actions";
import Navbar from "../components/Navbar";

const ICONOS_DEPORTE: Record<string, string> = {
  running: "🏃", cycling: "🚴"
};

const DEPORTES = [
  { codigo: "running", label: "Running", icono: "🏃" },
  { codigo: "cycling", label: "Ciclismo", icono: "🚴" },
];

function EstrellasPromedio({ promedio }: { promedio: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => {
        const llena = promedio >= n;
        const parcial = !llena && promedio > n - 1;
        const pct = parcial ? Math.round((promedio - (n - 1)) * 100) : 0;
        return (
          <span key={n} style={{ fontSize: "1.4rem", position: "relative", display: "inline-block", color: "var(--rc-border, #374151)" }}>
            ★
            {(llena || parcial) && (
              <span style={{ position: "absolute", left: 0, top: 0, width: llena ? "100%" : `${pct}%`, overflow: "hidden", color: "var(--rc-accent, #f59e0b)" }}>★</span>
            )}
          </span>
        );
      })}
    </div>
  );
}

type Props = { perfil: PerfilData };

export default function PerfilClient({ perfil }: Props) {
  const router = useRouter();
  const icono = perfil.codigoDeporte ? (ICONOS_DEPORTE[perfil.codigoDeporte] ?? "🏅") : null;

  const [editando, setEditando] = useState(!perfil.codigoDeporte || !perfil.ubicacion);
  const [deporte, setDeporte] = useState(perfil.codigoDeporte ?? "");
  const [ubicacion, setUbicacion] = useState(perfil.ubicacionDisplay ?? "");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);

  const guardar = () => {
    setError(null);
    setExito(false);
    startTransition(async () => {
      try {
        await actualizarPerfil({
          ubicacion: ubicacion || null,
          codigoDeporte: deporte || null,
        });
        setExito(true);
        setEditando(false);
        router.refresh();
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "No se pudo guardar el perfil.");
      }
    });
  };

  return (
    <div className="rc-root min-h-screen">
      <Navbar />
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "2rem 1rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>

        {/* Hero del perfil */}
        <div className="rc-card" style={{ padding: "2rem 1.5rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
          <div className="rc-avatar" style={{ width: 72, height: 72, fontSize: "1.8rem", fontWeight: 700, flexShrink: 0 }}>
            {perfil.fotoPerfil
              ? <img src={perfil.fotoPerfil} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} alt={perfil.nombre} />
              : perfil.nombre[0].toUpperCase()}
          </div>

          <div style={{ textAlign: "center" }}>
            <h1 style={{ fontSize: "1.4rem", fontWeight: 700, margin: 0 }}>{perfil.nombre}</h1>
            <p style={{ fontSize: "0.85rem", color: "var(--rc-muted)", margin: "0.2rem 0 0" }}>{perfil.email}</p>
          </div>

          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center" }}>
            {perfil.codigoDeporte && (
              <span style={{ fontSize: "0.75rem", padding: "4px 12px", borderRadius: 999, background: "var(--rc-surface)", border: "1px solid var(--rc-border)", display: "flex", alignItems: "center", gap: "0.3rem", textTransform: "capitalize" }}>
                {icono} {perfil.codigoDeporte}
              </span>
            )}
            {perfil.ubicacionDisplay && (
              <span style={{ fontSize: "0.75rem", padding: "4px 12px", borderRadius: 999, background: "var(--rc-surface)", border: "1px solid var(--rc-border)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                📍 {perfil.ubicacionDisplay}
              </span>
            )}
            {!perfil.codigoDeporte && !perfil.ubicacion && (
              <span style={{ fontSize: "0.75rem", color: "var(--rc-muted)" }}>
                Sin deporte ni ubicación configurados
              </span>
            )}
          </div>
        </div>

        {/* Editar deporte y ubicación */}
        <div className="rc-card" style={{ padding: "1.5rem", borderTop: "3px solid var(--rc-accent)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <p style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--rc-muted)", margin: 0 }}>
              Deporte y ubicación
            </p>
            {!editando && (
              <button
                className="rc-btn-secondary"
                style={{ padding: "0.35rem 0.8rem", borderRadius: 6, fontSize: "0.75rem" }}
                onClick={() => setEditando(true)}
              >
                Editar
              </button>
            )}
          </div>

          {editando ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--rc-muted)" }}>
                  Deporte preferido
                </label>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  {DEPORTES.map((d) => (
                    <button
                      key={d.codigo}
                      type="button"
                      onClick={() => setDeporte(d.codigo)}
                      disabled={isPending}
                      className={deporte === d.codigo ? "rc-btn-primary" : "rc-btn-secondary"}
                      style={{ flex: 1, padding: "0.6rem", borderRadius: 8, fontSize: "0.85rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}
                    >
                      <span>{d.icono}</span> {d.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--rc-muted)" }}>
                  Ubicación
                </label>
                <input
                  type="text"
                  value={ubicacion}
                  onChange={(ev) => setUbicacion(ev.target.value)}
                  disabled={isPending}
                  placeholder="Ej: Bahía Blanca, Buenos Aires"
                  className="rc-input"
                  style={{ padding: "0.6rem 0.8rem", borderRadius: 8, fontSize: "0.85rem", background: "var(--rc-surface)", border: "1px solid var(--rc-border)", color: "inherit" }}
                />
              </div>

              {error && (
                <div style={{ fontSize: "0.8rem", color: "var(--rc-error, #dc2626)", background: "var(--rc-error-bg, #fee2e2)", padding: "0.6rem 0.8rem", borderRadius: 8 }}>
                  ⚠️ {error}
                </div>
              )}

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  className="rc-btn-primary"
                  style={{ flex: 1, padding: "0.65rem", borderRadius: 8, fontSize: "0.85rem" }}
                  onClick={guardar}
                  disabled={isPending || !deporte || !ubicacion.trim()}
                >
                  {isPending ? "Guardando..." : "Guardar"}
                </button>
                {perfil.codigoDeporte && perfil.ubicacion && (
                  <button
                    className="rc-btn-secondary"
                    style={{ padding: "0.65rem 1rem", borderRadius: 8, fontSize: "0.85rem" }}
                    onClick={() => {
                      setDeporte(perfil.codigoDeporte ?? "");
                      setUbicacion(perfil.ubicacionDisplay ?? "");
                      setError(null);
                      setEditando(false);
                    }}
                    disabled={isPending}
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", fontSize: "0.85rem" }}>
              <p style={{ margin: 0 }}>
                <span style={{ color: "var(--rc-muted)" }}>Deporte: </span>
                <span style={{ textTransform: "capitalize" }}>{icono} {perfil.codigoDeporte}</span>
              </p>
              <p style={{ margin: 0 }}>
                <span style={{ color: "var(--rc-muted)" }}>Ubicación: </span>
                📍 {perfil.ubicacionDisplay}
              </p>
              {exito && (
                <p style={{ margin: "0.3rem 0 0", fontSize: "0.75rem", color: "green" }}>
                  ✓ Perfil actualizado
                </p>
              )}
            </div>
          )}
        </div>

        {/* Puntuación */}
        <div className="rc-card" style={{ padding: "1.5rem", borderTop: "3px solid var(--rc-accent)" }}>
          <p style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--rc-muted)", margin: "0 0 1rem" }}>
            Puntuación recibida
          </p>

          {perfil.promedioCalificacion !== null ? (
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <span style={{ fontSize: "3rem", fontWeight: 800, color: "var(--rc-accent)", lineHeight: 1 }}>
                {perfil.promedioCalificacion.toFixed(1)}
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                <EstrellasPromedio promedio={perfil.promedioCalificacion} />
                <span style={{ fontSize: "0.75rem", color: "var(--rc-muted)" }}>
                  basado en {perfil.cantidadCalificaciones} calificación{perfil.cantidadCalificaciones !== 1 ? "es" : ""}
                </span>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <span style={{ fontSize: "2.5rem", opacity: 0.4 }}>⭐</span>
              <div>
                <p style={{ fontSize: "0.9rem", fontWeight: 600, margin: 0 }}>Sin calificaciones aún</p>
                <p style={{ fontSize: "0.75rem", color: "var(--rc-muted)", margin: "0.2rem 0 0" }}>
                  Participá en entrenamientos para recibir tu primera puntuación.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem" }}>
          {[
            { icon: "", value: perfil.cantidadCalificaciones, label: "Calificaciones" },
            { icon: "", value: perfil.entrenamientosOrganizados, label: "Organizados" },
            { icon: "", value: perfil.entrenamientosParticipados, label: "Participados" },
          ].map(({ icon, value, label }) => (
            <div key={label} className="rc-card" style={{ padding: "1.25rem 0.75rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4rem", background: "var(--rc-surface)" }}>
              <span style={{ fontSize: "1.3rem" }}>{icon}</span>
              <span style={{ fontSize: "1.5rem", fontWeight: 800, lineHeight: 1 }}>{value}</span>
              <span style={{ fontSize: "0.7rem", color: "var(--rc-muted)", textAlign: "center" }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Acciones */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <button className="rc-btn-secondary" style={{ padding: "0.65rem", borderRadius: 8, fontSize: "0.85rem" }} onClick={() => router.push("/sugerencias")}>
            Ver sugerencias de entrenamientos
          </button>
          <button className="rc-btn-secondary" style={{ padding: "0.65rem", borderRadius: 8, fontSize: "0.85rem" }} onClick={() => router.push("/mis-entrenamientos")}>
            Mis entrenamientos
          </button>
        </div>

      </div>
    </div>
  );
}