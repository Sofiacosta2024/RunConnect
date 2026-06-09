"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getParticipantes, getCalificacionesEmitidas } from "./actions";
import ModalCalificacion from "./ModalCalificacion";
import type { Participante, CalificacionEmitida } from "./Types";

type Props = {
  codigoEntrenamiento: number;
  participantesIniciales: Participante[];
  emitidasIniciales: CalificacionEmitida[];
};

function TarjetaParticipante({
  participante,
  calificacionPrevia,
  onCalificar,
}: {
  participante: Participante;
  calificacionPrevia?: CalificacionEmitida;
  onCalificar: () => void;
}) {
  const yaCalificado = !!calificacionPrevia;

  return (
    <div
      className="rc-card flex items-center gap-4 px-4 py-3"
      style={{
        background: yaCalificado ? "var(--rc-surface)" : undefined,
        opacity: yaCalificado ? 0.75 : 1,
      }}
    >
      <div className="rc-avatar w-10 h-10 text-sm flex-shrink-0 font-semibold">
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

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{participante.nombre}</p>
        {yaCalificado ? (
          <div className="flex items-center gap-2 mt-0.5">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <span
                  key={n}
                  style={{
                    fontSize: "1.2rem",
                    color:
                      n <= calificacionPrevia.puntaje
                        ? "var(--rc-accent, #f59e0b)"
                        : "var(--rc-border, #d1d5db)",
                  }}
                >
                  ★
                </span>
              ))}
            </div>

            <span
              className="text-xs"
              style={{ color: "var(--rc-muted)" }}
            >
              {calificacionPrevia.comentario
                ? `"${calificacionPrevia.comentario}"`
                : "Sin comentario"}
            </span>
          </div>
        ) : (
          <p className="text-xs" style={{ color: "var(--rc-muted)" }}>
            Todavía no la calificaste
          </p>
        )}
      </div>

      {yaCalificado ? (
        <span
          className="text-xs px-2 py-1 rounded-full flex-shrink-0"
          style={{
            background: "var(--rc-success-bg, #dcfce7)",
            color: "var(--rc-success, #16a34a)",
          }}
        >
          ✓ Calificado
        </span>
      ) : (
        <button
          className="rc-btn-primary px-3 py-1.5 rounded-lg text-xs flex-shrink-0"
          onClick={onCalificar}
        >
          Calificar
        </button>
      )}
    </div>
  );
}

export default function CalificacionClient({
  codigoEntrenamiento,
  participantesIniciales,
  emitidasIniciales,
}: Props) {
  const router = useRouter();
  const [participantes, setParticipantes] = useState(participantesIniciales);
  const [emitidas, setEmitidas] = useState(emitidasIniciales);
  const [seleccionado, setSeleccionado] = useState<Participante | null>(null);
  const [exito, setExito] = useState(false);
  const [, startTransition] = useTransition();

  const recargar = () => {
    startTransition(async () => {
      const [p, e] = await Promise.all([
        getParticipantes(codigoEntrenamiento),
        getCalificacionesEmitidas(codigoEntrenamiento),
      ]);
      setParticipantes(p);
      setEmitidas(e);
    });
  };

  const handleExito = () => {
    setSeleccionado(null);
    setExito(true);
    recargar();
    setTimeout(() => setExito(false), 3000);
  };

  const pendientes = participantes.filter(
    (p) => !emitidas.some((e) => e.emailCalificado === p.email)
  );
  const calificados = participantes.filter((p) =>
    emitidas.some((e) => e.emailCalificado === p.email)
  );

  return (
    <div className="rc-root min-h-screen">
      <div className="max-w-xl w-full mx-auto px-4 py-8 flex flex-col gap-6">

        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold">Calificar participantes</h1>
          <p className="text-sm" style={{ color: "var(--rc-muted)" }}>
            Entrenamiento #{codigoEntrenamiento} · Solo podés calificar a cada
            persona una vez.
          </p>
        </div>

        {exito && (
          <div
            className="text-sm px-4 py-3 rounded-lg"
            style={{
              background: "var(--rc-success-bg, #dcfce7)",
              color: "var(--rc-success, #16a34a)",
            }}
            role="status"
          >
            ✓ Calificación enviada correctamente.
          </div>
        )}

        {participantes.length === 0 ? (
          <div
            className="rc-card flex flex-col items-center gap-2 py-12"
            style={{ background: "var(--rc-surface)" }}
          >
            <span className="text-3xl">🏃</span>
            <p className="text-sm text-center" style={{ color: "var(--rc-muted)" }}>
              No hay otros participantes en este entrenamiento para calificar.
            </p>
          </div>
        ) : (
          <>
            {pendientes.length > 0 && (
              <div className="flex flex-col gap-2">
                <p
                  className="text-xs font-semibold uppercase tracking-wide"
                  style={{ color: "var(--rc-muted)" }}
                >
                  Pendientes de calificación ({pendientes.length})
                </p>
                {pendientes.map((p) => (
                  <TarjetaParticipante
                    key={p.email}
                    participante={p}
                    onCalificar={() => setSeleccionado(p)}
                  />
                ))}
              </div>
            )}

            {calificados.length > 0 && (
              <div className="flex flex-col gap-2">
                <p
                  className="text-xs font-semibold uppercase tracking-wide"
                  style={{ color: "var(--rc-muted)" }}
                >
                  Ya calificados ({calificados.length})
                </p>
                {calificados.map((p) => (
                  <TarjetaParticipante
                    key={p.email}
                    participante={p}
                    calificacionPrevia={emitidas.find(
                      (e) => e.emailCalificado === p.email
                    )}
                    onCalificar={() => {}}
                  />
                ))}
              </div>
            )}

            {pendientes.length === 0 && (
              <div
                className="rc-card flex flex-col items-center gap-2 py-8"
                style={{ background: "var(--rc-surface)" }}
              >
                <span className="text-2xl">🎉</span>
                <p className="text-sm font-semibold">¡Calificaste a todos!</p>
                <p
                  className="text-xs text-center"
                  style={{ color: "var(--rc-muted)" }}
                >
                  Ya enviaste tu opinión sobre todos los participantes de este
                  entrenamiento.
                </p>
              </div>
            )}
          </>
        )}

        <button
          className="rc-btn-secondary px-4 py-2 rounded-lg text-sm self-start"
          onClick={() => router.back()}
        >
          ← Volver
        </button>
      </div>

      {seleccionado && (
        <ModalCalificacion
          participante={seleccionado}
          codigoEntrenamiento={codigoEntrenamiento}
          onClose={() => setSeleccionado(null)}
          onExito={handleExito}
        />
      )}
    </div>
  );
}