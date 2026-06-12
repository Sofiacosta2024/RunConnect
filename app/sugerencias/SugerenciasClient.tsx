"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getSugerencias } from "./actions";
import TarjetaEntrenamiento from "./TarjetaEntrenamiento";
import type { EntrenamientoSugerido } from "./actions";
import Navbar from "../components/Navbar";


const NIVELES = ["principiante", "intermedio", "avanzado"];

type Perfil = {
  nombre: string;
  codigoDeporte: string | null;
  ubicacion: string | null;
} | null;

type Props = {
  perfil: Perfil;
  sugerenciasIniciales: EntrenamientoSugerido[];
  nivelDefault: string;
};

export default function SugerenciasClient({
  perfil,
  sugerenciasIniciales,
  nivelDefault,
}: Props) {
  const router = useRouter();
  const [sugerencias, setSugerencias] = useState(sugerenciasIniciales);
  const [nivel, setNivel] = useState(nivelDefault);
  const [distanciaKm, setDistanciaKm] = useState(10);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const perfilIncompleto = !perfil?.codigoDeporte || !perfil?.ubicacion;

  const cargar = (nuevoNivel = nivel, distancia = distanciaKm) => {
    setError(null);
    startTransition(async () => {
      try {
        const data = await getSugerencias({
          nivel: nuevoNivel,
          distanciaMaxKm: distancia,
        });
        setSugerencias(data);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "No se pudieron cargar las sugerencias.");
      }
    });
  };

  const handleNivel = (n: string) => {
    setNivel(n);
    cargar(n, distanciaKm);
  };

  const handleDistancia = (km: number) => {
    setDistanciaKm(km);
    cargar(nivel, km);
  };

  return (
    <div className="rc-root min-h-screen">
      <Navbar />
      <div className="rc-page">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap" style={{ marginBottom: "6px" }}>
          <div>
            <h1 className="rc-page-title">Sugerencias para vos</h1>
            <p className="rc-page-subtitle" style={{ marginBottom: 0 }}>
              {perfil?.codigoDeporte
                ? <>Basadas en tu interés en <span className="font-medium capitalize" style={{ color: "var(--rc-text)" }}>{perfil.codigoDeporte}</span> · dentro de {distanciaKm} km</>
                : "Completá tu perfil para recibir sugerencias personalizadas."}
            </p>
          </div>

          <button
            className="rc-btn-secondary"
            style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", padding: "10px 18px", flexShrink: 0 }}
            onClick={() => cargar()}
            disabled={isPending || perfilIncompleto}
            title="Actualizar sugerencias"
          >
            <span style={{ display: "inline-block", transition: "transform 0.5s", transform: isPending ? "rotate(360deg)" : "none" }}>
              🔄
            </span>
            Actualizar
          </button>
        </div>

        {/* Aviso perfil incompleto */}
        {perfilIncompleto && (
          <div
            className="rc-card"
            style={{ display: "flex", alignItems: "flex-start", gap: "14px", borderLeft: "3px solid var(--rc-accent)" }}
          >
            <span style={{ fontSize: "26px", flexShrink: 0 }}>👤</span>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <p style={{ fontSize: "15px", fontWeight: 600, margin: 0 }}>Completá tu perfil</p>
              <p style={{ fontSize: "13px", color: "var(--rc-muted)", margin: 0, lineHeight: 1.5 }}>
                Necesitamos tu deporte preferido y ubicación para mostrarte entrenamientos relevantes.
              </p>
              <button
                className="rc-btn-primary"
                style={{ alignSelf: "flex-start", marginTop: "6px", padding: "8px 16px", fontSize: "13px" }}
                onClick={() => router.push("/perfil")}
              >
                Ir a mi perfil →
              </button>
            </div>
          </div>
        )}

        {/* Filtros */}
        {!perfilIncompleto && (
          <div className="rc-card" style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <div>
              <p className="rc-section-title" style={{ margin: "0 0 12px" }}>Nivel</p>
              <div style={{ display: "flex", gap: "10px" }}>
                {NIVELES.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => handleNivel(n)}
                    disabled={isPending}
                    className={nivel === n ? "rc-btn-primary" : "rc-btn-secondary"}
                    style={{ flex: 1, padding: "10px 14px", fontSize: "13px", fontWeight: 600, borderRadius: "10px" }}
                  >
                    {n.charAt(0).toUpperCase() + n.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="rc-section-title" style={{ margin: "0 0 12px" }}>Distancia máxima</p>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={distanciaKm}
                  onChange={(e) => handleDistancia(Number(e.target.value))}
                  disabled={isPending}
                  style={{ flex: 1, accentColor: "var(--rc-accent)" }}
                />
                <span style={{ fontSize: "14px", fontWeight: 600, minWidth: "60px", textAlign: "right", color: "var(--rc-text)" }}>
                  {distanciaKm} km
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rc-form-error" role="alert">
            ⚠️ {error}
          </div>
        )}

        {/* Resultados */}
        {!perfilIncompleto && (
          <div style={{ marginTop: "8px" }}>
            <div className="flex items-center justify-between" style={{ marginBottom: "12px" }}>
              <p className="rc-section-title" style={{ margin: 0 }}>
                {isPending
                  ? "Buscando entrenamientos..."
                  : `${sugerencias.length} entrenamiento${sugerencias.length !== 1 ? "s" : ""} encontrado${sugerencias.length !== 1 ? "s" : ""}`}
              </p>
              {sugerencias.length > 0 && (
                <span style={{ fontSize: "12px", color: "var(--rc-muted)" }}>
                  Ordenados por cercanía
                </span>
              )}
            </div>

            {/* Skeleton loader */}
            {isPending && (
              <div className="rc-list">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="rc-card"
                    style={{ height: "130px", animation: "pulse 1.5s ease-in-out infinite", opacity: 1 - i * 0.2, marginBottom: 0 }}
                  />
                ))}
              </div>
            )}

            {/* Lista */}
            {!isPending && sugerencias.length > 0 && (
              <div className="rc-list">
                {sugerencias.map((e) => (
                  <TarjetaEntrenamiento
                    key={e.codigoEntrenamiento}
                    entrenamiento={e}
                    onVerDetalleAction={(id) => router.push(`/entrenamiento/${id}`)}
                  />
                ))}
              </div>
            )}

            {/* Estado vacío */}
            {!isPending && sugerencias.length === 0 && !error && (
              <div className="rc-empty rc-card">
                <div className="rc-empty-icon">🔍</div>
                <p className="rc-empty-text" style={{ fontSize: "16px", fontWeight: 600, color: "var(--rc-text)", marginBottom: "6px" }}>
                  Sin resultados por ahora
                </p>
                <p className="rc-empty-text" style={{ fontSize: "13px", lineHeight: 1.6 }}>
                  No hay entrenamientos de nivel <span style={{ fontWeight: 600, color: "var(--rc-text)" }}>{nivel}</span> a menos de {distanciaKm} km.
                  <br />
                  Probá con otro nivel.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:.6} 50%{opacity:.3} }`}</style>
    </div>
  );
}