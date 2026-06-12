import { headers } from "next/headers";
import { db } from "@/lib/db";
import { usuario, entrenamiento, usuarioEntrenamiento, solicitud } from "@/db/schema";
import { count, eq, sql } from "drizzle-orm";
import { getAdminSession } from "@/lib/admin-auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const session = await getAdminSession(await headers());
  if (!session) redirect("/login");

  const [totalUsuarios] = await db
    .select({ total: count() })
    .from(usuario);

  const [totalEntrenamientos] = await db
    .select({ total: count() })
    .from(entrenamiento);

  const [entrenamientosAbiertos] = await db
    .select({ total: count() })
    .from(entrenamiento)
    .where(eq(entrenamiento.estado, "abierto"));

  const [solicitudesPendientes] = await db
    .select({ total: count() })
    .from(solicitud)
    .where(eq(solicitud.estado, "pendiente"));

  const [totalParticipaciones] = await db
    .select({ total: count() })
    .from(usuarioEntrenamiento);

  const stats = [
    { label: "Usuarios", value: Number(totalUsuarios.total), icon: "👥" },
    { label: "Entrenamientos", value: Number(totalEntrenamientos.total), icon: "🏃" },
    { label: "Abiertos", value: Number(entrenamientosAbiertos.total), icon: "✅" },
    { label: "Solicitudes pendientes", value: Number(solicitudesPendientes.total), icon: "📩" },
    { label: "Participaciones", value: Number(totalParticipaciones.total), icon: "🤝" },
  ];

  const ultimosEntrenamientos = await db
    .select({
      codigoEntrenamiento: entrenamiento.codigoEntrenamiento,
      codigoDeporte: entrenamiento.codigoDeporte,
      fechaInicio: sql`${entrenamiento.fechaInicio}::text`,
      estado: entrenamiento.estado,
      nivel: entrenamiento.nivel,
    })
    .from(entrenamiento)
    .orderBy(desc(entrenamiento.codigoEntrenamiento))
    .limit(5);

  return (
    <div>
      <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, letterSpacing: "2px", marginBottom: 8 }}>
        Dashboard
      </h1>
      <p style={{ color: "var(--rc-muted)", marginBottom: 32, fontSize: 15 }}>
        Resumen general de la plataforma.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 40 }}>
        {stats.map((s) => (
          <div
            key={s.label}
            style={{
              background: "var(--rc-card)",
              border: "1px solid var(--rc-border)",
              borderRadius: 16,
              padding: "24px 20px",
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 28, fontWeight: 700 }}>{s.value}</div>
            <div style={{ color: "var(--rc-muted)", fontSize: 13, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, letterSpacing: "1px", marginBottom: 16 }}>
        Últimos entrenamientos
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {ultimosEntrenamientos.map((e) => (
          <div
            key={e.codigoEntrenamiento}
            style={{
              background: "var(--rc-card)",
              border: "1px solid var(--rc-border)",
              borderRadius: 12,
              padding: "14px 20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <span style={{ fontWeight: 600 }}>#{e.codigoEntrenamiento}</span>
              <span style={{ color: "var(--rc-muted)", marginLeft: 12 }}>{e.codigoDeporte}</span>
              <span style={{ color: "var(--rc-muted)", marginLeft: 12, fontSize: 13 }}>{e.nivel}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.8px",
                padding: "4px 12px",
                borderRadius: 100,
                border: "1px solid",
                borderColor: e.estado === "abierto" ? "var(--rc-teal)" : e.estado === "finalizado" ? "var(--rc-muted)" : "var(--rc-accent)",
                color: e.estado === "abierto" ? "var(--rc-teal)" : e.estado === "finalizado" ? "var(--rc-muted)" : "var(--rc-accent)",
              }}>
                {e.estado}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function desc(col: any) {
  return sql`${col} DESC`;
}
