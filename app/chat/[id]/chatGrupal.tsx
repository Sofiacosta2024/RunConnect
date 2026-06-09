"use client";

import { useParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { getMensajes, enviarMensaje } from "./actions";

type Mensaje = Awaited<ReturnType<typeof getMensajes>>[number];

function agruparPorFecha(mensajes: Mensaje[]) {
  const grupos: { label: string; items: Mensaje[] }[] = [];
  let labelActual = "";

  for (const m of mensajes) {
    const fecha = new Date(m.creadoEn);
    const hoy = new Date();
    const ayer = new Date();
    ayer.setDate(hoy.getDate() - 1);

    let label: string;
    if (fecha.toDateString() === hoy.toDateString()) {
      label = "Hoy";
    } else if (fecha.toDateString() === ayer.toDateString()) {
      label = "Ayer";
    } else {
      label = fecha.toLocaleDateString("es-AR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });
    }

    if (label !== labelActual) {
      labelActual = label;
      grupos.push({ label, items: [] });
    }
    grupos[grupos.length - 1].items.push(m);
  }

  return grupos;
}

function Avatar({ nombre, fotoPerfil }: { nombre: string; fotoPerfil: string | null }) {
  return (
    <div className="rc-avatar w-8 h-8 text-xs flex-shrink-0 font-semibold">
      {fotoPerfil ? (
        <img
          src={fotoPerfil}
          className="w-full h-full rounded-full object-cover"
          alt={nombre}
        />
      ) : (
        nombre[0].toUpperCase()
      )}
    </div>
  );
}

function BurbujaMensaje({
  mensaje,
  esMio,
  mostrarNombre,
}: {
  mensaje: Mensaje;
  esMio: boolean;
  mostrarNombre: boolean;
}) {
  const hora = new Date(mensaje.creadoEn).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className={`flex gap-2 items-end ${esMio ? "flex-row-reverse" : "flex-row"}`}
    >
      {!esMio && (
        <div className="mb-1">
          <Avatar nombre={mensaje.nombre} fotoPerfil={mensaje.fotoPerfil} />
        </div>
      )}

      <div
        className={`flex flex-col gap-0.5 max-w-[70%] ${
          esMio ? "items-end" : "items-start"
        }`}
      >
        {mostrarNombre && !esMio && (
          <span
            className="text-xs font-semibold px-1"
            style={{ color: "var(--rc-accent)" }}
          >
            {mensaje.nombre}
          </span>
        )}

        <div
          className={`px-3 py-2 text-sm rounded-2xl break-words ${
            esMio
              ? "rc-btn-primary rounded-br-sm"
              : "rc-card rounded-bl-sm"
          }`}
          style={
            esMio
              ? { borderRadius: "18px 18px 4px 18px" }
              : {
                  borderRadius: "18px 18px 18px 4px",
                  background: "var(--rc-surface)",
                }
          }
        >
          {mensaje.contenido}
        </div>

        <span
          className="text-xs px-1"
          style={{ color: "var(--rc-muted)", fontSize: "0.7rem" }}
        >
          {hora}
        </span>
      </div>

      {esMio && <div className="w-2 flex-shrink-0" />}
    </div>
  );
}

function SeparadorFecha({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-2 px-2">
      <div className="flex-1 h-px" style={{ background: "var(--rc-border)" }} />
      <span
        className="text-xs px-2 py-0.5 rounded-full"
        style={{
          color: "var(--rc-muted)",
          background: "var(--rc-surface)",
          fontSize: "0.7rem",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
      <div className="flex-1 h-px" style={{ background: "var(--rc-border)" }} />
    </div>
  );
}

export default function ChatPage() {
  const params = useParams();
  const codigoEntrenamiento = Number(params.id);

  // En producción esto vendría de la sesión del servidor.
  // Se asume que `getMensajes` devuelve el `email` del usuario actual
  // y que hay acceso al email de sesión aquí (simulado con variable).
  const [emailSesion, setEmailSesion] = useState<string | null>(null);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [texto, setTexto] = useState("");
  const [isPending, startTransition] = useTransition();
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const esPrimeraCarga = useRef(true);

  // Carga inicial + polling
  useEffect(() => {
    if (isNaN(codigoEntrenamiento)) return;

    const cargar = async () => {
      try {
        const data = await getMensajes(codigoEntrenamiento);
        setMensajes(data);
        if (esPrimeraCarga.current) {
          setCargando(false);
          esPrimeraCarga.current = false;
        }
      } catch {
        setCargando(false);
      }
    };

    cargar();
    const intervalo = setInterval(cargar, 3000);
    return () => clearInterval(intervalo);
  }, [codigoEntrenamiento]);

  // Auto-scroll: siempre en carga inicial, solo si el usuario está abajo en polling
  useEffect(() => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    const estaAbajo = el.scrollHeight - el.scrollTop - el.clientHeight < 100;

    if (esPrimeraCarga.current || estaAbajo) {
      bottomRef.current?.scrollIntoView({ behavior: esPrimeraCarga.current ? "auto" : "smooth" });
    }
  }, [mensajes]);

  const handleEnviar = () => {
    if (!texto.trim() || isPending) return;
    setErrorEnvio(null);
    const contenido = texto.trim();
    setTexto("");

    startTransition(async () => {
      try {
        await enviarMensaje(codigoEntrenamiento, contenido);
        const data = await getMensajes(codigoEntrenamiento);
        setMensajes(data);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Error al enviar el mensaje";
        setErrorEnvio(
          msg === "No autenticado"
            ? "Tu sesión expiró. Por favor recargá la página."
            : msg === "Mensaje inválido"
            ? "El mensaje es inválido o supera los 500 caracteres."
            : "No pudimos enviar tu mensaje. Intentá de nuevo."
        );
        setTexto(contenido); // restaurar el texto si falló
      } finally {
        inputRef.current?.focus();
      }
    });
  };

  const grupos = agruparPorFecha(mensajes);
  const caractereRestantes = 500 - texto.length;

  return (
    <div className="rc-root min-h-screen flex flex-col">
      <div className="max-w-2xl w-full mx-auto flex flex-col flex-1 px-4 py-6 gap-3">

        {/* Header */}
        <div
          className="rc-card flex items-center gap-3 px-4 py-3"
          style={{ background: "var(--rc-surface)" }}
        >
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-base flex-shrink-0"
            style={{ background: "var(--rc-accent)", color: "white" }}
          >
            👥
          </div>
          <div>
            <h1 className="text-sm font-bold leading-tight">
              Entrenamiento #{codigoEntrenamiento}
            </h1>
            <p className="text-xs" style={{ color: "var(--rc-muted)" }}>
              {mensajes.length > 0
                ? `${mensajes.length} mensaje${mensajes.length !== 1 ? "s" : ""}`
                : "Chat grupal"}
            </p>
          </div>
        </div>

        {/* Área de mensajes */}
        <div
          ref={scrollRef}
          className="rc-card flex-1 flex flex-col overflow-y-auto p-4 gap-1"
          style={{ minHeight: "55vh", maxHeight: "55vh" }}
        >
          {cargando ? (
            <div className="flex-1 flex items-center justify-center">
              <span className="text-sm" style={{ color: "var(--rc-muted)" }}>
                Cargando mensajes...
              </span>
            </div>
          ) : mensajes.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-2">
              <span className="text-2xl">💬</span>
              <p className="text-sm text-center" style={{ color: "var(--rc-muted)" }}>
                Nadie escribió todavía.
                <br />
                ¡Sé el primero en decir algo!
              </p>
            </div>
          ) : (
            grupos.map((grupo) => {
              let emailAnterior: string | null = null;
              return (
                <div key={grupo.label} className="flex flex-col gap-1">
                  <SeparadorFecha label={grupo.label} />
                  {grupo.items.map((m) => {
                    const esMio = m.email === emailSesion;
                    const mostrarNombre = m.email !== emailAnterior;
                    emailAnterior = m.email;
                    return (
                      <BurbujaMensaje
                        key={m.codigoMensaje}
                        mensaje={m}
                        esMio={esMio}
                        mostrarNombre={mostrarNombre}
                      />
                    );
                  })}
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Error de envío */}
        {errorEnvio && (
          <div
            className="text-xs px-3 py-2 rounded-lg"
            style={{
              background: "var(--rc-error-bg, #fee2e2)",
              color: "var(--rc-error, #dc2626)",
            }}
          >
            ⚠️ {errorEnvio}
          </div>
        )}

        {/* Input */}
        <div className="flex flex-col gap-1">
          <div className="flex gap-2 items-end">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                className="rc-input w-full pr-16"
                placeholder="Escribí un mensaje..."
                value={texto}
                onChange={(e) => {
                  setTexto(e.target.value);
                  if (errorEnvio) setErrorEnvio(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleEnviar();
                  }
                }}
                maxLength={500}
                disabled={isPending}
                autoComplete="off"
              />
              {texto.length > 400 && (
                <span
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs pointer-events-none"
                  style={{
                    color: caractereRestantes <= 20 ? "var(--rc-error, #dc2626)" : "var(--rc-muted)",
                  }}
                >
                  {caractereRestantes}
                </span>
              )}
            </div>
            <button
              className="rc-btn-primary px-4 py-2 rounded-lg flex-shrink-0 flex items-center gap-1.5 text-sm"
              onClick={handleEnviar}
              disabled={isPending || !texto.trim()}
              title="Enviar (Enter)"
            >
              {isPending ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
              ) : (
                <>
                  <span>Enviar</span>
                  <span aria-hidden="true" style={{ fontSize: "0.8rem" }}>↑</span>
                </>
              )}
            </button>
          </div>
          <p className="text-xs px-1" style={{ color: "var(--rc-muted)" }}>
            Presioná Enter para enviar · Solo miembros aceptados pueden participar
          </p>
        </div>
      </div>
    </div>
  );
}