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
  cupoMaximo: number | null;
  cupoOcupado: number;
};

interface Props {
  solicitud: Solicitud;
}

const ESTADO_LABEL: Record<string, { label: string; bg: string; color: string }> = {
  pendiente: { label: "Pendiente", bg: "#fef9c320", color: "#ca8a04" },
  aprobado:  { label: "Aceptado",  bg: "#dcfce720", color: "#16a34a" },
  rechazado: { label: "Rechazado", bg: "#fee2e220", color: "#dc2626" },
};

const NIVEL_COLOR: Record<string, string> = {
  principiante: "#16a34a",
  intermedio:   "#ca8a04",
  avanzado:     "#dc2626",
};

export default function SolicitudCard({ solicitud }: Props) {
  const router = useRouter();
  const [accionPendiente, setAccionPendiente] = useState<"accept" | "reject" | null>(null);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const [resuelta, setResuelta] = useState(solicitud.estado !== "pendiente");

  const cupoRestante =
    solicitud.cupoMaximo !== null
      ? solicitud.cupoMaximo - solicitud.cupoOcupado
      : null;
  const cupoDisponible = cupoRestante === null || cupoRestante > 0;
  const isPending = accionPendiente !== null;

  async function resolver(accion: "accept" | "reject") {
    setErrorLocal(null);
    setAccionPendiente(accion);
    try {
      const res = await fetch(
        `/api/trainings/${solicitud.codigoEntrenamiento}/requests/${solicitud.codigoSolicitud}/${accion}`,
        { method: "PATCH" }
      );
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error ?? "Ocurrió un error");
      }
      setResuelta(true);
      router.refresh();
    } catch (e) {
      setErrorLocal(e instanceof Error ? e.message : "Ocurrió un error");
    } finally {
      setAccionPendiente(null);
    }
  }

  const estadoInfo = ESTADO_LABEL[solicitud.estado] ?? ESTADO_LABEL.pendiente;

  return (
    <div
      className="rc-card"
      style={{
        padding: "1.25rem",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        opacity: resuelta ? 0.65 : 1,
        transition: "opacity 0.3s",
        borderLeft: `3px solid ${estadoInfo.color}`,
      }}
    >
      {/* Header: avatar + nombre + badge estado */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <div
          className="rc-avatar"
          style={{ width: 40, height: 40, fontSize: "0.9rem", fontWeight: 600, flexShrink: 0 }}
        >
          {solicitud.nombreSolicitante[0].toUpperCase()}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 700, fontSize: "0.95rem", margin: 0 }}>
            {solicitud.nombreSolicitante}
          </p>
          <p style={{ fontSize: "0.75rem", color: "var(--rc-muted)", margin: 0 }}>
            {solicitud.emailSolicitante}
          </p>
        </div>

        <span
          style={{
            fontSize: "0.7rem",
            fontWeight: 600,
            padding: "3px 10px",
            borderRadius: 999,
            background: estadoInfo.bg,
            color: estadoInfo.color,
            border: `1px solid ${estadoInfo.color}40`,
            flexShrink: 0,
          }}
        >
          {estadoInfo.label}
        </span>
      </div>

      {/* Detalles del entrenamiento */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          flexWrap: "wrap",
          background: "var(--rc-surface)",
          borderRadius: 8,
          padding: "0.6rem 0.75rem",
        }}
      >
        <Chip icon="" text={solicitud.deporte} />
        <Chip
          icon=""
          text={solicitud.nivel}
          color={NIVEL_COLOR[solicitud.nivel]}
        />
        <Chip
          icon=""
          text={new Date(solicitud.fechaInicio).toLocaleDateString("es-AR", {
            day: "numeric", month: "short", year: "numeric",
          })}
        />
        <Chip
          icon="👥"
          text={
            cupoRestante === null
              ? "Sin límite de cupo"
              : cupoRestante === 0
              ? "Sin cupo disponible"
              : `${cupoRestante} lugar${cupoRestante !== 1 ? "es" : ""} disponible${cupoRestante !== 1 ? "s" : ""}`
          }
          color={cupoRestante === 0 ? "#dc2626" : undefined}
        />
      </div>

      {/* Error inline */}
      {errorLocal && (
        <p
          style={{
            fontSize: "0.75rem",
            padding: "0.5rem 0.75rem",
            borderRadius: 8,
            background: "#fee2e2",
            color: "#dc2626",
            margin: 0,
          }}
        >
          ⚠️ {errorLocal}
        </p>
      )}

      {/* Acciones */}
      {!resuelta && (
        <>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              className="rc-btn-primary"
              style={{
                flex: 1,
                padding: "0.55rem",
                borderRadius: 8,
                fontSize: "0.85rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.4rem",
                opacity: !cupoDisponible ? 0.5 : 1,
                cursor: !cupoDisponible ? "not-allowed" : "pointer",
              }}
              onClick={() => resolver("accept")}
              disabled={isPending || !cupoDisponible}
              title={!cupoDisponible ? "El cupo está completo" : undefined}
            >
              {accionPendiente === "accept"
                ? <Spinner color="white" />
                : ""} Aceptar
            </button>

            <button
              className="rc-btn-secondary"
              style={{
                flex: 1,
                padding: "0.55rem",
                borderRadius: 8,
                fontSize: "0.85rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.4rem",
                color: "#dc2626",
                borderColor: "#dc262640",
              }}
              onClick={() => resolver("reject")}
              disabled={isPending}
            >
              {accionPendiente === "reject"
                ? <Spinner color="#dc2626" />
                : ""} Rechazar
            </button>
          </div>

          {!cupoDisponible && (
            <p style={{ fontSize: "0.72rem", textAlign: "center", color: "#dc2626", margin: 0 }}>
              El cupo está completo. Liberá un lugar para aceptar esta solicitud.
            </p>
          )}
        </>
      )}
    </div>
  );
}

function Chip({ icon, text, color }: { icon: string; text: string; color?: string }) {
  return (
    <span style={{ fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.3rem", color: color ?? "inherit" }}>
      {icon} <span style={{ fontWeight: 500, textTransform: "capitalize" }}>{text}</span>
    </span>
  );
}

function Spinner({ color }: { color: string }) {
  return (
    <span
      style={{
        width: 14,
        height: 14,
        border: `2px solid ${color}`,
        borderTopColor: "transparent",
        borderRadius: "50%",
        display: "inline-block",
        animation: "spin 0.7s linear infinite",
      }}
    />
  );
}