import type { EntrenamientoListItem } from "@/services/entrenamientoService";

type Props = {
  entrenamiento: EntrenamientoListItem;
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

export default function EntrenamientoCard({ entrenamiento }: Props) {
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
