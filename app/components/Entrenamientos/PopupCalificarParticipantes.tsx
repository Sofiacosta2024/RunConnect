"use client";

import { useRouter } from "next/navigation";

type Props = {
  open: boolean;
  codigoEntrenamiento: number;
  onClose: () => void;
};

export default function PopupCalificarParticipantes({
  open,
  codigoEntrenamiento,
  onClose,
}: Props) {
  const router = useRouter();

  if (!open) return null;

  function handleSi() {
    router.push(`/rating/${codigoEntrenamiento}`);
  }

  return (
    <div className="rc-modal-backdrop" onClick={onClose}>
      <div
        className="rc-modal"
        style={{ maxWidth: 400, textAlign: "center" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontSize: 48, marginBottom: 12 }}>⭐</div>
        <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>
          Entrenamiento finalizado
        </h2>
        <p
          style={{
            color: "var(--rc-muted)",
            fontSize: 14,
            lineHeight: 1.6,
            marginBottom: 24,
          }}
        >
          ¿Querés calificar a los participantes?
        </p>
        <div style={{ display: "flex", gap: 12 }}>
          <button
            className="rc-btn-submit"
            style={{ flex: 1 }}
            onClick={handleSi}
          >
            Sí
          </button>
          <button
            className="rc-btn-secondary"
            style={{ flex: 1, padding: "12px 20px", fontSize: 14, fontWeight: 600 }}
            onClick={onClose}
          >
            No
          </button>
        </div>
      </div>
    </div>
  );
}
