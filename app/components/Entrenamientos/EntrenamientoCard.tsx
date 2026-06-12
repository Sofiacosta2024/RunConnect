"use client";
import type { EntrenamientoListItem } from "@/services/entrenamientoService";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  entrenamiento: EntrenamientoListItem;
  mostrarBotonSolicitud?: boolean;
  esOrganizador?: boolean;
};

const deporteEmoji: Record<string, string> = {
  running: "🏃",
  cycling: "🚴",
};

const nivelColor: Record<string, string> = {
  principiante: "#00C9A7",
  intermedio: "#FF7A00",
  avanzado: "#FF3C3C",
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

function distanceLabel(km: number | null) {
  if (km === null) return "—";
  return `${km.toFixed(1)} km`;
}

export default function EntrenamientoCard({ entrenamiento, mostrarBotonSolicitud = false, esOrganizador = false }: Props) {
const [loading, setLoading] = useState(false);
const [enviada, setEnviada] = useState(false);
const router = useRouter();

async function solicitarParticipacion() {
  try {
    setLoading(true);

    const res = await fetch(
      `/api/trainings/${entrenamiento.codigoEntrenamiento}/requests`,
      {
        method: "POST",
      }
    );

    if (!res.ok) {
      const error = await res.json();
      alert(error.error ?? "No se pudo enviar la solicitud");
      return;
    }

    setEnviada(true);
  } catch {
    alert("Error de conexión");
  } finally {
    setLoading(false);
  }
}

  return (
    <div className="rc-card entrenamiento-card">
      <div className="rc-user-row">
        <div
          className="rc-avatar"
          style={{ background: "var(--rc-grad)" }}
        >
          {deporteEmoji[entrenamiento.codigoDeporte] ?? "🏋️"}
        </div>
        <div className="flex-1">
          <div className="rc-user-name">
            {entrenamiento.descripcionDeporte ?? entrenamiento.codigoDeporte}
          </div>
          <div className="rc-user-meta">
            {formatDate(entrenamiento.fechaInicio)} ·{" "}
            {formatTime(entrenamiento.fechaInicio)}
          </div>
        </div>
        <span
          className="entrenamiento-nivel"
          style={{
            background: `${nivelColor[entrenamiento.nivel] ?? "#7B7B8F"}20`,
            color: nivelColor[entrenamiento.nivel] ?? "#7B7B8F",
            borderColor: nivelColor[entrenamiento.nivel] ?? "#7B7B8F",
          }}
        >
          {entrenamiento.nivel}
        </span>
      </div>

      <div className="rc-stats-grid">
        <EntrenamientoStat
          label="Distancia"
          value={distanceLabel(entrenamiento.distanciaEstimada)}
        />
        <EntrenamientoStat
          label="Ritmo"
          value={entrenamiento.ritmoObjetivo ?? "—"}
        />
        <EntrenamientoStat
          label="Cupo"
          value={
            entrenamiento.cupoMaximo !== null
              ? `${entrenamiento.cupoMaximo} plazas`
              : "Sin límite"
          }
        />
        <EntrenamientoStat
          label="Estado"
          value={entrenamiento.estado}
        />
      </div>
      {mostrarBotonSolicitud && !esOrganizador ? (
        <div className="entrenamiento-actions">
          <button
            className="rc-btn-primary"
            onClick={solicitarParticipacion}
            disabled={loading || enviada}
          >
            {loading
              ? "Enviando..."
              : enviada
              ? "Solicitud enviada"
              : "Solicitar participación"}
          </button>
        </div>
      ) : (
        <div className="entrenamiento-actions">
          <button
            className="rc-btn-secondary"
            onClick={() => router.push(`/chat/${entrenamiento.codigoEntrenamiento}`)}
            style={{
              background: "rgba(255,60,60,0.1)",
              border: "1px solid rgba(255,60,60,0.2)",
              color: "#FF3C3C",
              padding: "8px 20px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            💬 Chat del grupo
          </button>
        </div>
      )}
    </div>
  );
}

function EntrenamientoStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rc-wstat">
      <div className="rc-wstat-val" style={{ fontSize: "14px" }}>
        {value}
      </div>
      <div className="rc-wstat-label">{label}</div>
    </div>
  );
}
