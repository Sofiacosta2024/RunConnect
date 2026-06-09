// app/chat/[id]/page.tsx
"use client";

import { useParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { getMensajes, enviarMensaje } from "./actions";

type Mensaje = Awaited<ReturnType<typeof getMensajes>>[number];

export default function ChatPage() {
  const params = useParams();
  const codigoEntrenamiento = Number(params.id);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [texto, setTexto] = useState("");
  const [isPending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Polling cada 3 segundos
  useEffect(() => {
    if (isNaN(codigoEntrenamiento)) return;
    const cargar = () =>
      getMensajes(codigoEntrenamiento).then(setMensajes);

    cargar();
    const intervalo = setInterval(cargar, 3000);
    return () => clearInterval(intervalo);
  }, [codigoEntrenamiento]);

  // Auto-scroll al último mensaje
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  const handleEnviar = () => {
    if (!texto.trim()) return;
    startTransition(async () => {
      await enviarMensaje(codigoEntrenamiento, texto);
      setTexto("");
      getMensajes(codigoEntrenamiento).then(setMensajes);
    });
  };

  return (
    <div className="rc-root min-h-screen flex flex-col">
      <div className="max-w-2xl w-full mx-auto flex flex-col flex-1 px-4 py-8 gap-4">
        <h1 className="text-xl font-bold">💬 Chat del entrenamiento #{codigoEntrenamiento}</h1>

        {/* Mensajes */}
        <div className="rc-card flex-1 flex flex-col gap-3 overflow-y-auto p-4" style={{ minHeight: "60vh", maxHeight: "60vh" }}>
          {mensajes.map((m) => (
            <div key={m.codigoMensaje} className="flex gap-3 items-start">
              <div className="rc-avatar w-8 h-8 text-sm flex-shrink-0">
                {m.fotoPerfil
                  ? <img src={m.fotoPerfil} className="w-full h-full rounded-full object-cover" alt={m.nombre} />
                  : m.nombre[0].toUpperCase()}
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex gap-2 items-baseline">
                  <span className="text-sm font-semibold">{m.nombre}</span>
                  <span className="text-xs" style={{ color: "var(--rc-muted)" }}>
                    {new Date(m.creadoEn).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <div className="rc-card px-3 py-2 text-sm" style={{ background: "var(--rc-surface)" }}>
                  {m.contenido}
                </div>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <input
            className="rc-input flex-1"
            placeholder="Escribí un mensaje..."
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleEnviar()}
            maxLength={500}
          />
          <button
            className="rc-btn-primary px-4 py-2 rounded-lg"
            onClick={handleEnviar}
            disabled={isPending || !texto.trim()}
          >
            {isPending ? "..." : "Enviar"}
          </button>
        </div>
      </div>
    </div>
  );
}