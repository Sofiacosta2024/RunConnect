"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getSugerencias } from "@/app/sugerencias/actions";
import type { EntrenamientoSugerido } from "@/app/sugerencias/actions";
import EntrenamientoCard from "../Entrenamientos/EntrenamientoCard";
import { EntrenamientoListItem } from "@/services/entrenamientoService";

type Props = {
  sugerenciasIniciales: EntrenamientoSugerido[];
};

export default function Feed({ sugerenciasIniciales = [] }: Props) {
  const router = useRouter();
  const [sugerencias, setSugerencias] = useState(sugerenciasIniciales);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const refrescar = () => {
    setError(null);
    startTransition(async () => {
      try {
        const data = await getSugerencias({ nivel: "intermedio", distanciaMaxKm: 10 });
        setSugerencias(data);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "No se pudieron cargar las sugerencias.");
      }
    });
  };

  if (error) {
    return (
      <div
        className="rc-card px-4 py-3 text-sm"
        style={{ color: "var(--rc-error, #dc2626)", background: "var(--rc-error-bg, #fee2e2)" }}
      >
        ⚠️ {error}
      </div>
    );
  }

  if (sugerencias.length === 0) {
    return (
      <div
        className="rc-card flex flex-col items-center gap-2 py-10 text-center"
        style={{ background: "var(--rc-surface)" }}
      >
        <span className="text-3xl">🔍</span>
        <p className="text-sm font-semibold">Sin sugerencias por ahora</p>
        <p className="text-xs" style={{ color: "var(--rc-muted)" }}>
          No encontramos entrenamientos cerca tuyo. Revisá tu perfil o volvé más tarde.
        </p>
        <button
          className="rc-btn-secondary px-4 py-2 rounded-lg text-sm mt-1"
          onClick={refrescar}
          disabled={isPending}
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">
          Sugerencias para vos
        </p>
        <button
          className="rc-btn-secondary px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5"
          onClick={refrescar}
          disabled={isPending}
        >
          <span style={{ display: "inline-block", transition: "transform 0.5s", transform: isPending ? "rotate(360deg)" : "none" }}>
            🔄
          </span>
          {isPending ? "Actualizando..." : "Actualizar"}
        </button>
      </div>

      {isPending ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rc-card"
              style={{ height: "130px", background: "var(--rc-surface)", opacity: 1 - i * 0.2, animation: "pulse 1.5s ease-in-out infinite" }}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {sugerencias.map((e) => {
            const item: EntrenamientoListItem = {
              codigoEntrenamiento: e.codigoEntrenamiento,
              emailOrganizador: "",
              codigoDeporte: e.codigoDeporte,
              descripcionDeporte: e.codigoDeporte,
              fechaInicio: e.fechaInicio.toISOString(),
              fechaFin: e.fechaFin.toISOString(),
              estado: "abierto",
              puntoEncuentro: null,
              distanciaEstimada:
                e.distanciaEstimada != null
                  ? Number(e.distanciaEstimada)
                  : null,
              ritmoObjetivo: e.ritmoObjetivo,
              nivel: e.nivel,
              cupoMaximo: e.cupoMaximo,
            };

            return (
              <EntrenamientoCard
                key={item.codigoEntrenamiento}
                entrenamiento={item}
                mostrarBotonSolicitud
              />
            );
          })}
        </div>
      )}

      <style>{`@keyframes pulse { 0%,100%{opacity:.6} 50%{opacity:.3} }`}</style>
    </div>
  );
}