"use client";

import EntrenamientoCard from "../components/Entrenamientos/EntrenamientoCard";
import type { EntrenamientoSugerido } from "./actions";

type Props = {
  entrenamiento: EntrenamientoSugerido;
  onVerDetalle: (id: number) => void;
};

interface EntrenamientoCardData {
  codigoEntrenamiento: number;
  codigoDeporte: string;
  descripcionDeporte: string;
  fechaInicio: string;
  fechaFin: string;
  nivel: string;
  distanciaEstimada: number | null;
  ritmoObjetivo: string | null;
  cupoMaximo: number | null;
  estado: string;
}

export default function TarjetaEntrenamiento({ entrenamiento: e, onVerDetalle }: Props) {
  // Mapeo de EntrenamientoSugerido al tipo que espera EntrenamientoCard
  const item: EntrenamientoCardData = {
    codigoEntrenamiento: e.codigoEntrenamiento,
    codigoDeporte: e.codigoDeporte,
    descripcionDeporte: e.codigoDeporte, // Podríamos mapear a un nombre más amigable si tuviéramos esa info
    fechaInicio: e.fechaInicio.toISOString(),
    fechaFin: e.fechaFin.toISOString(),
    nivel: e.nivel,
    distanciaEstimada: e.distanciaEstimada ? Number(e.distanciaEstimada) : null,
    ritmoObjetivo: e.ritmoObjetivo,
    cupoMaximo: e.cupoMaximo,
    estado: "abierto" as const,
  };

  return (
    <div className="flex flex-col gap-1">
      {/* Badge de distancia al usuario, encima de la card existente */}
      <div className="flex items-center gap-1.5 px-1">
        <span style={{ fontSize: "0.75rem", color: "var(--rc-muted)" }}>📍</span>
        <span className="text-xs" style={{ color: "var(--rc-muted)" }}>
          A{" "}
          <span className="font-semibold" style={{ color: "var(--rc-accent)" }}>
            {e.distanciaKm} km
          </span>{" "}
          de vos · Organiza{" "}
          <span className="font-medium">{e.organizadorNombre}</span>
        </span>
      </div>

      <button
        type="button"
        onClick={() => onVerDetalle(e.codigoEntrenamiento)}
        style={{
          textAlign: "left",
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          width: "100%",
        }}
      >
        <EntrenamientoCard entrenamiento={item} />
      </button>
    </div>
  );
}