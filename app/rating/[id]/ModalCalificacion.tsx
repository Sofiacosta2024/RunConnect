"use client";

import { useState, useTransition } from "react";
import { calificar } from "./actions";
import type { Participante } from "./Types";
const ETIQUETAS = ["", "Muy malo", "Malo", "Regular", "Bueno", "Excelente"];

type Props = {
  participante: Participante;
  codigoEntrenamiento: number;
  onCloseAction: () => void;
  onExitoAction: () => void;
};

export default function ModalCalificacion({
  participante,
  codigoEntrenamiento,
  onCloseAction,
  onExitoAction,
}: Props) {
  const [puntaje, setPuntaje] = useState(0);
  const [comentario, setComentario] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleEnviar = () => {
    if (puntaje === 0) {
      setError("Seleccioná un puntaje entre 1 y 5.");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await calificar({
          emailCalificado: participante.email,
          codigoEntrenamiento,
          puntaje,
          comentario: comentario.trim() || null,
        });
        onExitoAction();
      } catch (e: unknown) {
        setError(
          e instanceof Error ? e.message : "No se pudo enviar la calificación."
        );
      }
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.4)" }}
      onClick={(e) => e.target === e.currentTarget && onCloseAction()}
    >
      <div
        className="rc-card w-full max-w-sm flex flex-col gap-5 p-6"
        style={{ background: "var(--rc-bg, white)" }}
      >
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="rc-avatar w-10 h-10 text-sm font-semibold flex-shrink-0">
            {participante.fotoPerfil ? (
              <img
                src={participante.fotoPerfil}
                className="w-full h-full rounded-full object-cover"
                alt={participante.nombre}
              />
            ) : (
              participante.nombre[0].toUpperCase()
            )}
          </div>
          <div>
            <p className="text-sm font-bold">Calificar a {participante.nombre}</p>
            <p className="text-xs" style={{ color: "var(--rc-muted)" }}>
              Solo podés calificarla una vez en este entrenamiento.
            </p>
          </div>
          <button
            className="ml-auto text-lg leading-none"
            style={{ color: "var(--rc-muted)", background: "none", border: "none", cursor: "pointer" }}
            onClick={onCloseAction}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

      {/* Puntaje */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex", gap: 4 }}>
              {[1,2,3,4,5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPuntaje(n)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "2rem",
                    color: n <= puntaje ? "var(--rc-accent, #f97316)" : "var(--rc-border, #374151)",
                    transition: "color 0.15s, transform 0.1s",
                    transform: n <= puntaje ? "scale(1.15)" : "scale(1)",
                    padding: 0,
                    lineHeight: 1,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--rc-accent, #f97316)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = n <= puntaje ? "var(--rc-accent, #f97316)" : "var(--rc-border, #374151)")}
                >
                  ★
                </button>
              ))}
            </div>
            <span style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--rc-accent, #f97316)", minHeight: 20 }}>
              {puntaje > 0 ? ETIQUETAS[puntaje] : "Seleccioná un puntaje"}
            </span>
          </div>

        {/* Comentario */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold">
            Comentario{" "}
            <span className="font-normal" style={{ color: "var(--rc-muted)" }}>
              (opcional)
            </span>
          </label>
          <textarea
            className="rc-input resize-none"
            rows={3}
            placeholder="Contá cómo fue la experiencia..."
            maxLength={300}
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            style={{ fontFamily: "inherit" }}
          />
          <span
            className="text-xs text-right"
            style={{
              color:
                comentario.length > 270
                  ? "var(--rc-error, #dc2626)"
                  : "var(--rc-muted)",
            }}
          >
            {300 - comentario.length} caracteres restantes
          </span>
        </div>

        {/* Error */}
        {error && (
          <p
            className="text-xs px-3 py-2 rounded-lg"
            style={{
              background: "var(--rc-error-bg, #fee2e2)",
              color: "var(--rc-error, #dc2626)",
            }}
            role="alert"
          >
            ⚠️ {error}
          </p>
        )}

        {/* Botones */}
        <div className="flex gap-2 justify-end">
          <button
            className="rc-btn-secondary px-4 py-2 rounded-lg text-sm"
            onClick={onCloseAction}
            disabled={isPending}
          >
            Cancelar
          </button>
          <button
            className="rc-btn-primary px-5 py-2 rounded-lg text-sm flex items-center gap-2"
            onClick={handleEnviar}
            disabled={isPending || puntaje === 0}
          >
            {isPending ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                Enviando...
              </>
            ) : (
              "Enviar calificación"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}