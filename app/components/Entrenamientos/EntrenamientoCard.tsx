"use client";
import type { EntrenamientoListItem } from "@/services/entrenamientoService";
import { useState } from "react";
import { useRouter } from "next/navigation";
import PopupCalificarParticipantes from "./PopupCalificarParticipantes";

type Props = {
  entrenamiento: EntrenamientoListItem;
  mostrarBotonSolicitud?: boolean;
  esOrganizador?: boolean;
  esParticipante?: boolean;
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

const estadoLabel: Record<string, string> = {
  abierto: "Abierto",
  cerrado: "Cerrado",
  cancelado: "Cancelado",
  finalizado: "Finalizado",
};

const estadoColor: Record<string, string> = {
  abierto: "#00C9A7",
  cerrado: "#FF7A00",
  cancelado: "#FF3C3C",
  finalizado: "#7B7B8F",
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

export default function EntrenamientoCard({ entrenamiento, mostrarBotonSolicitud = false, esOrganizador = false, esParticipante = false }: Props) {
const [loading, setLoading] = useState(false);
const [enviada, setEnviada] = useState(false);
const [finalizando, setFinalizando] = useState(false);
const [showPopup, setShowPopup] = useState(false);
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

async function handleFinalizar() {
  try {
    setFinalizando(true);

    const res = await fetch(
      `/api/trainings/${entrenamiento.codigoEntrenamiento}/finalize`,
      { method: "PATCH" }
    );

    if (!res.ok) {
      const error = await res.json();
      alert(error.error ?? "No se pudo finalizar el entrenamiento");
      return;
    }

    setShowPopup(true);
  } catch {
    alert("Error de conexión");
  } finally {
    setFinalizando(false);
  }
}

  const puedeCalificar = esOrganizador || esParticipante;
  const esFinalizado = entrenamiento.estado === "finalizado";

  return (
    <div
      className="rc-card entrenamiento-card"
      style={{
        opacity: esFinalizado && !puedeCalificar ? 0.5 : 1,
        filter: esFinalizado && !puedeCalificar ? "grayscale(0.6)" : "none",
      }}
    >
      {/* Estado badge arriba */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 12,
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 11,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.8px",
            padding: "4px 12px",
            borderRadius: 100,
            background: `${estadoColor[entrenamiento.estado] ?? "#7B7B8F"}18`,
            color: estadoColor[entrenamiento.estado] ?? "#7B7B8F",
            border: `1px solid ${estadoColor[entrenamiento.estado] ?? "#7B7B8F"}30`,
          }}
        >
          {esFinalizado ? "✅" : entrenamiento.estado === "abierto" ? "🟢" : entrenamiento.estado === "cerrado" ? "🔒" : "⛔"}
          {" "}{estadoLabel[entrenamiento.estado] ?? entrenamiento.estado}
        </span>
      </div>

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
      </div>

      {esFinalizado ? (
        puedeCalificar ? (
          <div className="entrenamiento-actions">
            <button
              className="rc-btn-primary"
              onClick={() => router.push(`/rating/${entrenamiento.codigoEntrenamiento}`)}
            >
              ⭐ Calificar
            </button>
          </div>
        ) : null
      ) : mostrarBotonSolicitud && !esOrganizador ? (
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
      ) : esOrganizador && entrenamiento.estado !== "cancelado" ? (
        <div className="entrenamiento-actions" style={{ display: "flex", gap: 8 }}>
          <button
            className="rc-btn-primary"
            onClick={handleFinalizar}
            disabled={finalizando}
          >
            {finalizando ? "Finalizando..." : "🏁 Finalizar"}
          </button>
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

      <PopupCalificarParticipantes
        open={showPopup}
        codigoEntrenamiento={entrenamiento.codigoEntrenamiento}
        onClose={() => setShowPopup(false)}
      />
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
