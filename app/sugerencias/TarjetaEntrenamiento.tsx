"use client";

import EntrenamientoCard from "../components/Entrenamientos/EntrenamientoCard";
import type { EntrenamientoSugerido } from "./actions";
import type { EntrenamientoListItem } from "@/services/entrenamientoService";

type Props = {
  entrenamiento: EntrenamientoSugerido;
  onVerDetalleAction: (id: number) => void;
};

export default function TarjetaEntrenamiento({
  entrenamiento: e,
  onVerDetalleAction,
}: Props) {
  const item: EntrenamientoListItem = {
    codigoEntrenamiento: e.codigoEntrenamiento,
    emailOrganizador: "", // Reemplazar por el email real si está disponible
    codigoDeporte: e.codigoDeporte,
    descripcionDeporte: e.codigoDeporte,
    fechaInicio: e.fechaInicio.toISOString(),
    fechaFin: e.fechaFin.toISOString(),
    estado: "abierto",
    puntoEncuentro: null, // Reemplazar por el valor real si está disponible
    distanciaEstimada:
      e.distanciaEstimada != null
        ? Number(e.distanciaEstimada)
        : null,
    ritmoObjetivo: e.ritmoObjetivo,
    nivel: e.nivel,
    cupoMaximo: e.cupoMaximo,
  };

  return (
    <div className="flex flex-col gap-1">
      {/* Badge de distancia al usuario */}
      <div className="flex items-center gap-1.5 px-1">
        <span
          style={{
            fontSize: "0.75rem",
            color: "var(--rc-muted)",
          }}
        >
          📍
        </span>

        <span
          className="text-xs"
          style={{ color: "var(--rc-muted)" }}
        >
          A{" "}
          <span
            className="font-semibold"
            style={{ color: "var(--rc-accent)" }}
          >
            {e.distanciaKm} km
          </span>{" "}
          de vos · Organiza{" "}
          <span className="font-medium">
            {e.organizadorNombre}
          </span>
        </span>
      </div>

      <button
        type="button"
        onClick={() => onVerDetalleAction(e.codigoEntrenamiento)}
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