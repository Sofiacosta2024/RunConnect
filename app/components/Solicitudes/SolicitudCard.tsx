"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Solicitud = {
  codigoSolicitud: number;
  codigoEntrenamiento: number;
  nombreSolicitante: string;
  emailSolicitante: string;
  deporte: string;
  fechaInicio: Date | string;
  nivel: string;
  estado: string;
};

interface Props {
  solicitud: Solicitud;
}

export default function SolicitudCard({
  solicitud,
}: Props) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  async function resolver(
    accion: "accept" | "reject"
  ) {
    try {
      setLoading(true);

      const res = await fetch(
        `/api/trainings/${solicitud.codigoEntrenamiento}/requests/${solicitud.codigoSolicitud}/${accion}`,
        {
          method: "PATCH",
        }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(
          error.error ?? "Ocurrió un error"
        );
      }

      router.refresh();
    } catch (e) {
      alert(
        e instanceof Error
          ? e.message
          : "Ocurrió un error"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="solicitud-card">
      <div className="solicitud-card-header">
        <h3>{solicitud.nombreSolicitante}</h3>

        <span className="solicitud-estado">
          {solicitud.estado}
        </span>
      </div>

      <div className="solicitud-card-body">
        <p>
          <strong>Email:</strong>{" "}
          {solicitud.emailSolicitante}
        </p>

        <p>
          <strong>Deporte:</strong>{" "}
          {solicitud.deporte}
        </p>

        <p>
          <strong>Nivel:</strong>{" "}
          {solicitud.nivel}
        </p>

        <p>
          <strong>Fecha:</strong>{" "}
          {new Date(
            solicitud.fechaInicio
          ).toLocaleString("es-AR")}
        </p>
      </div>

      <div className="solicitud-card-actions">
        <button
          disabled={loading}
          className="solicitud-btn aceptar"
          onClick={() => resolver("accept")}
        >
          ✅ Aceptar
        </button>

        <button
          disabled={loading}
          className="solicitud-btn rechazar"
          onClick={() => resolver("reject")}
        >
          ❌ Rechazar
        </button>
      </div>
    </div>
  );
}