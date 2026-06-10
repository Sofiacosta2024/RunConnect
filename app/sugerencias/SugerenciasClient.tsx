"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getSugerencias } from "./actions";
import TarjetaEntrenamiento from "./TarjetaEntrenamiento";
import type { EntrenamientoSugerido } from "./actions";

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
  distanciaDefault: number;
};

export default function SugerenciasClient({
  perfil,
  sugerenciasIniciales,
  nivelDefault,
  distanciaDefault,
}: Props) {
  const router = useRouter();
  const [sugerencias, setSugerencias] = useState(sugerenciasIniciales);
  const [nivel, setNivel] = useState(nivelDefault);
  const [distanciaMaxKm, setDistanciaMaxKm] = useState(distanciaDefault);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const perfilIncompleto = !perfil?.codigoDeporte || !perfil?.ubicacion;

  const cargar = (nuevoNivel = nivel, nuevaDistancia = distanciaMaxKm) => {
    setError(null);
    startTransition(async () => {
      try {
        const data = await getSugerencias({
          nivel: nuevoNivel,
          distanciaMaxKm: nuevaDistancia,
        });
        setSugerencias(data);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "No se pudieron cargar las sugerencias.");
      }
    });
  };

  const handleNivel = (n: string) => {
    setNivel(n);
    cargar(n, distanciaMaxKm);
  };

  const handleDistancia = (d: number) => {
    setDistanciaMaxKm(d);
    cargar(nivel, d);
  };

  return (
    <div className="rc-root min-h-screen">
      <div className="max-w-xl w-full mx-auto px-4 py-8 flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Sugerencias para vos</h1>
            <p className="text-sm mt-1" style={{ color: "var(--rc-muted)" }}>
              {perfil?.codigoDeporte
                ? <>Basadas en tu interés en <span className="font-medium capitalize">{perfil.codigoDeporte}</span></>
                : "Completá tu perfil para recibir sugerencias personalizadas."}
            </p>
          </div>

          <button
            className="rc-btn-secondary px-3 py-2 rounded-lg text-sm flex items-center gap-1.5 flex-shrink-0"
            onClick={() => cargar()}
            disabled={isPending || perfilIncompleto}
            title="Actualizar sugerencias"
          >
            <span
              style={{
                display: "inline-block",
                transition: "transform 0.5s",
                transform: isPending ? "rotate(360deg)" : "none",
              }}
            >
              🔄
            </span>
            Actualizar
          </button>
        </div>

        {/* Aviso perfil incompleto */}
        {perfilIncompleto && (
          <div
            className="rc-card flex items-start gap-3 px-4 py-3"
            style={{ background: "var(--rc-surface)", borderLeft: "3px solid var(--rc-accent)" }}
          >
            <span className="text-xl flex-shrink-0">👤</span>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold">Completá tu perfil</p>
              <p className="text-xs" style={{ color: "var(--rc-muted)" }}>
                Necesitamos tu deporte preferido y ubicación para mostrarte entrenamientos relevantes.
              </p>
              <button
                className="rc-btn-primary px-3 py-1.5 rounded-lg text-xs self-start mt-1"
                onClick={() => router.push("/perfil")}
              >
                Ir a mi perfil →
              </button>
            </div>
          </div>
        )}

        {/* Filtros */}
        {!perfilIncompleto && (
          <div className="rc-card flex flex-col gap-4 p-4">
            {/* Nivel */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--rc-muted)" }}>
                Nivel
              </label>
              <div className="flex gap-2">
                {NIVELES.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => handleNivel(n)}
                    disabled={isPending}
                    className={nivel === n ? "rc-btn-primary" : "rc-btn-secondary"}
                    style={{ padding: "6px 14px", borderRadius: "8px", fontSize: "0.8rem", flex: 1 }}
                  >
                    {n.charAt(0).toUpperCase() + n.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Distancia */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--rc-muted)" }}>
                  Distancia máxima
                </label>
                <span className="text-sm font-bold" style={{ color: "var(--rc-accent)" }}>
                  {distanciaMaxKm} km
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                step={1}
                value={distanciaMaxKm}
                onChange={(e) => handleDistancia(Number(e.target.value))}
                disabled={isPending}
                className="w-full"
                style={{ accentColor: "var(--rc-accent)" }}
              />
              <div className="flex justify-between">
                <span className="text-xs" style={{ color: "var(--rc-muted)" }}>1 km</span>
                <span className="text-xs" style={{ color: "var(--rc-muted)" }}>10 km</span>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            className="text-sm px-4 py-3 rounded-lg"
            style={{ background: "var(--rc-error-bg, #fee2e2)", color: "var(--rc-error, #dc2626)" }}
            role="alert"
          >
            ⚠️ {error}
          </div>
        )}

        {/* Resultados */}
        {!perfilIncompleto && (
          <div className="flex flex-col gap-3">
            {/* Header resultados */}
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--rc-muted)" }}>
                {isPending
                  ? "Buscando entrenamientos..."
                  : `${sugerencias.length} entrenamiento${sugerencias.length !== 1 ? "s" : ""} encontrado${sugerencias.length !== 1 ? "s" : ""}`}
              </p>
              {sugerencias.length > 0 && (
                <span className="text-xs" style={{ color: "var(--rc-muted)" }}>
                  Ordenados por cercanía
                </span>
              )}
            </div>

            {/* Skeleton loader */}
            {isPending && (
              <div className="flex flex-col gap-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="rc-card p-4"
                    style={{
                      height: "130px",
                      background: "var(--rc-surface)",
                      animation: "pulse 1.5s ease-in-out infinite",
                      opacity: 1 - i * 0.2,
                    }}
                  />
                ))}
              </div>
            )}

            {/* Lista */}
            {!isPending && sugerencias.length > 0 && (
              <div className="flex flex-col gap-3">
                {sugerencias.map((e) => (
                  <TarjetaEntrenamiento
                    key={e.codigoEntrenamiento}
                    entrenamiento={e}
                    onVerDetalle={(id) => router.push(`/entrenamiento/${id}`)}
                  />
                ))}
              </div>
            )}

            {/* Estado vacío */}
            {!isPending && sugerencias.length === 0 && !error && (
              <div
                className="rc-card flex flex-col items-center gap-3 py-12 text-center"
                style={{ background: "var(--rc-surface)" }}
              >
                <span className="text-3xl">🔍</span>
                <div>
                  <p className="text-sm font-semibold">Sin resultados por ahora</p>
                  <p className="text-xs mt-1" style={{ color: "var(--rc-muted)" }}>
                    No hay entrenamientos de nivel{" "}
                    <span className="font-medium">{nivel}</span> a menos de{" "}
                    <span className="font-medium">{distanciaMaxKm} km</span>.
                    <br />
                    Probá ampliar la distancia o cambiar el nivel.
                  </p>
                </div>
                <button
                  className="rc-btn-secondary px-4 py-2 rounded-lg text-sm"
                  onClick={() => handleDistancia(10)}
                  disabled={distanciaMaxKm === 10}
                >
                  Ampliar a 10 km
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}