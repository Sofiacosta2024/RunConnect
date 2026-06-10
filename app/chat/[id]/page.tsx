"use client";

import { useParams, useRouter } from "next/navigation";
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
    if (fecha.toDateString() === hoy.toDateString()) label = "Hoy";
    else if (fecha.toDateString() === ayer.toDateString()) label = "Ayer";
    else label = fecha.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });
    if (label !== labelActual) { labelActual = label; grupos.push({ label, items: [] }); }
    grupos[grupos.length - 1].items.push(m);
  }
  return grupos;
}

function Avatar({ nombre, fotoPerfil }: { nombre: string; fotoPerfil: string | null }) {
  return (
    <div style={{
      width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
      background: "linear-gradient(135deg,#FF3C3C,#FF7A00)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 11, fontWeight: 700, color: "#fff", overflow: "hidden",
    }}>
      {fotoPerfil
        ? <img src={fotoPerfil} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt={nombre} />
        : nombre[0].toUpperCase()
      }
    </div>
  );
}

function BurbujaMensaje({ mensaje, esMio, mostrarNombre }: { mensaje: Mensaje; esMio: boolean; mostrarNombre: boolean }) {
  const hora = new Date(mensaje.creadoEn).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexDirection: esMio ? "row-reverse" : "row", marginBottom: 2 }}>
      {!esMio
        ? <Avatar nombre={mensaje.nombre} fotoPerfil={mensaje.fotoPerfil} />
        : <div style={{ width: 28, flexShrink: 0 }} />
      }
      <div style={{ display: "flex", flexDirection: "column", maxWidth: "68%", alignItems: esMio ? "flex-end" : "flex-start" }}>
        {mostrarNombre && !esMio && (
          <span style={{ fontSize: 11, fontWeight: 600, color: "#FF7A00", marginBottom: 3, paddingLeft: 4 }}>
            {mensaje.nombre}
          </span>
        )}
        <div style={{
          padding: "10px 14px",
          borderRadius: esMio ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
          background: esMio ? "linear-gradient(135deg,#FF3C3C,#FF7A00)" : "#1b1b25",
          color: "#F0EFF5",
          fontSize: 14,
          lineHeight: 1.45,
          wordBreak: "break-word",
        }}>
          {mensaje.contenido}
        </div>
        <span style={{ fontSize: 11, color: "#7B7B8F", marginTop: 3, padding: "0 4px" }}>{hora}</span>
      </div>
    </div>
  );
}

function SeparadorFecha({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "12px 0 8px" }}>
      <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
      <span style={{ fontSize: 11, color: "#7B7B8F", background: "#111118", padding: "3px 10px", borderRadius: 100, whiteSpace: "nowrap" }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
    </div>
  );
}

export default function ChatPage() {
  const params = useParams();
  const codigoEntrenamiento = Number(params.id);
  const router = useRouter();

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

  useEffect(() => {
    if (isNaN(codigoEntrenamiento)) return;
    const cargar = async () => {
      try {
        const data = await getMensajes(codigoEntrenamiento);
        setMensajes(data);
        if (esPrimeraCarga.current) { setCargando(false); esPrimeraCarga.current = false; }
      } catch { setCargando(false); }
    };
    cargar();
    const intervalo = setInterval(cargar, 3000);
    return () => clearInterval(intervalo);
  }, [codigoEntrenamiento]);

  useEffect(() => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    const estaAbajo = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    if (esPrimeraCarga.current || estaAbajo)
      bottomRef.current?.scrollIntoView({ behavior: esPrimeraCarga.current ? "auto" : "smooth" });
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
          msg === "No autenticado" ? "Tu sesión expiró. Por favor recargá la página."
          : msg === "Mensaje inválido" ? "El mensaje es inválido o supera los 500 caracteres."
          : "No pudimos enviar tu mensaje. Intentá de nuevo."
        );
        setTexto(contenido);
      } finally { inputRef.current?.focus(); }
    });
  };

  const grupos = agruparPorFecha(mensajes);
  const caractereRestantes = 500 - texto.length;

  // ─── Estilos base ───────────────────────────────────────────
  const S = {
    page:    { minHeight: "100vh", background: "#0A0A0F", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'DM Sans', sans-serif" } as React.CSSProperties,
    shell:   { width: "100%", maxWidth: 860, height: "92vh", display: "flex", flexDirection: "column" as const, background: "#16161F", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, overflow: "hidden" },
    header:  { padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 as const },
    hicon:   { width: 40, height: 40, borderRadius: 12, background: "rgba(255,60,60,0.12)", border: "1px solid rgba(255,60,60,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 },
    h1:      { fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: "1.5px", margin: 0, color: "#F0EFF5" } as React.CSSProperties,
    hsub:    { fontSize: 12, color: "#7B7B8F", margin: 0 } as React.CSSProperties,
    backBtn: { marginLeft: "auto", background: "none", border: "1px solid rgba(255,255,255,0.07)", color: "#7B7B8F", padding: "6px 14px", borderRadius: 8, fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" } as React.CSSProperties,
    msgs:    { flex: 1, overflowY: "auto" as const, padding: "20px 20px 8px", display: "flex", flexDirection: "column" as const, gap: 0, background: "#0A0A0F" },
    footer:  { padding: "12px 16px 14px", borderTop: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 as const, background: "#16161F" },
    pill:    { display: "flex", alignItems: "center", gap: 10, background: "#1b1b25", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 999, padding: "6px 6px 6px 18px" },
    input:   { flex: 1, background: "transparent", border: "none", outline: "none", color: "#F0EFF5", fontSize: 14, fontFamily: "'DM Sans', sans-serif" } as React.CSSProperties,
    sendBtn: { background: "linear-gradient(135deg,#FF3C3C,#FF7A00)", border: "none", color: "#fff", height: 42, padding: "0 22px", borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", flexShrink: 0, opacity: 1 } as React.CSSProperties,
    hint:    { fontSize: 11, color: "#7B7B8F", textAlign: "center" as const, marginTop: 8 },
    errBox:  { margin: "0 16px 8px", padding: "10px 14px", borderRadius: 10, background: "rgba(255,60,60,0.1)", border: "1px solid rgba(255,60,60,0.25)", color: "#FF3C3C", fontSize: 13, flexShrink: 0 as const },
  };

  return (
    <div style={S.page}>
      <div style={S.shell}>

        {/* Header */}
        <div style={S.header}>
          <div style={S.hicon}>💬</div>
          <div>
            <p style={S.h1}>Chat del entrenamiento</p>
            <p style={S.hsub}>Entrenamiento #{codigoEntrenamiento}</p>
          </div>
          <button style={S.backBtn} onClick={() => router.back()}>← Volver</button>
        </div>

        {/* Mensajes */}
        <div ref={scrollRef} style={S.msgs}>
          {cargando ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#7B7B8F", fontSize: 14 }}>Cargando mensajes...</span>
            </div>
          ) : mensajes.length === 0 ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
              <div style={{ fontSize: 52, opacity: 0.3 }}>💬</div>
              <p style={{ fontSize: 17, fontWeight: 600, color: "#F0EFF5", margin: 0 }}>Todavía no hay mensajes</p>
              <p style={{ fontSize: 13, color: "#7B7B8F", margin: 0 }}>Sé el primero en iniciar la conversación.</p>
            </div>
          ) : (
            grupos.map((grupo) => {
              let emailAnterior: string | null = null;
              return (
                <div key={grupo.label}>
                  <SeparadorFecha label={grupo.label} />
                  {grupo.items.map((m) => {
                    const esMio = m.email === emailSesion;
                    const mostrarNombre = m.email !== emailAnterior;
                    emailAnterior = m.email;
                    return <BurbujaMensaje key={m.codigoMensaje} mensaje={m} esMio={esMio} mostrarNombre={mostrarNombre} />;
                  })}
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Error */}
        {errorEnvio && <div style={S.errBox}>⚠️ {errorEnvio}</div>}

        {/* Input */}
        <div style={S.footer}>
          <div style={S.pill}>
            <div style={{ flex: 1, position: "relative" }}>
              <input
                ref={inputRef}
                style={S.input}
                placeholder="Escribí un mensaje..."
                value={texto}
                onChange={(e) => { setTexto(e.target.value); if (errorEnvio) setErrorEnvio(null); }}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleEnviar(); } }}
                maxLength={500}
                disabled={isPending}
                autoComplete="off"
              />
              {texto.length > 400 && (
                <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: caractereRestantes <= 20 ? "#FF3C3C" : "#7B7B8F" }}>
                  {caractereRestantes}
                </span>
              )}
            </div>
            <button
              style={{ ...S.sendBtn, opacity: isPending || !texto.trim() ? 0.45 : 1, cursor: isPending || !texto.trim() ? "not-allowed" : "pointer" }}
              onClick={handleEnviar}
              disabled={isPending || !texto.trim()}
            >
              {isPending ? "Enviando..." : "Enviar"}
            </button>
          </div>
          <p style={S.hint}>Presioná Enter para enviar · Solo miembros aceptados pueden participar</p>
        </div>

      </div>
    </div>
  );
}