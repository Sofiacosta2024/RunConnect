import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { entrenamiento, deporte, usuarioEntrenamiento } from "@/db/schema";
import { eq, sql, and, count } from "drizzle-orm";
import { getAdminSession } from "@/lib/admin-auth";
import AdminEntrenamientoActions from "./AdminEntrenamientoActions";
import Pagination from "@/app/components/Pagination";

export const dynamic = "force-dynamic";

const LIMITE = 15;

export default async function AdminEntrenamientosPage(props: { searchParams: Promise<{ pagina?: string }> }) {
  const session = await getAdminSession(await headers());
  if (!session) redirect("/login");

  const { pagina: rawPagina } = await props.searchParams;
  const pagina = Math.max(1, Number(rawPagina) || 1);
  const offset = (pagina - 1) * LIMITE;

  const [countRow] = await db
    .select({ total: count() })
    .from(entrenamiento)
    .innerJoin(deporte, eq(deporte.nombre, entrenamiento.codigoDeporte))
    .innerJoin(
      usuarioEntrenamiento,
      and(
        eq(usuarioEntrenamiento.codigoEntrenamiento, entrenamiento.codigoEntrenamiento),
        eq(usuarioEntrenamiento.rol, "organizador")
      )
    );

  const total = Number(countRow?.total ?? 0);
  const totalPaginas = Math.ceil(total / LIMITE);

  const rows = await db
    .select({
      codigoEntrenamiento: entrenamiento.codigoEntrenamiento,
      emailOrganizador: usuarioEntrenamiento.email,
      codigoDeporte: entrenamiento.codigoDeporte,
      descripcionDeporte: deporte.descripcionDeporte,
      fechaInicio: sql`${entrenamiento.fechaInicio}::text`,
      fechaFin: sql`${entrenamiento.fechaFin}::text`,
      estado: entrenamiento.estado,
      nivel: entrenamiento.nivel,
      cupoMaximo: entrenamiento.cupoMaximo,
    })
    .from(entrenamiento)
    .innerJoin(deporte, eq(deporte.nombre, entrenamiento.codigoDeporte))
    .innerJoin(
      usuarioEntrenamiento,
      and(
        eq(usuarioEntrenamiento.codigoEntrenamiento, entrenamiento.codigoEntrenamiento),
        eq(usuarioEntrenamiento.rol, "organizador")
      )
    )
    .orderBy(sql`${entrenamiento.codigoEntrenamiento} DESC`)
    .limit(LIMITE)
    .offset(offset);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, letterSpacing: "2px", marginBottom: 8 }}>
            Entrenamientos
          </h1>
          <p style={{ color: "var(--rc-muted)", fontSize: 15 }}>
            Total: {total} entrenamientos.
          </p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {rows.map((e) => (
          <div
            key={e.codigoEntrenamiento}
            style={{
              background: "var(--rc-card)",
              border: "1px solid var(--rc-border)",
              borderRadius: 12,
              padding: "16px 20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div>
                <span style={{ fontWeight: 600, fontSize: 15 }}>#{e.codigoEntrenamiento}</span>
                <span style={{ color: "var(--rc-muted)", marginLeft: 10, fontSize: 14 }}>{e.codigoDeporte}</span>
                <span style={{ color: "var(--rc-muted)", marginLeft: 10, fontSize: 13 }}>{e.nivel}</span>
                <span style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.8px",
                  padding: "3px 10px",
                  borderRadius: 100,
                  border: "1px solid",
                  marginLeft: 10,
                  borderColor: e.estado === "abierto" ? "var(--rc-teal)" : "var(--rc-muted)",
                  color: e.estado === "abierto" ? "var(--rc-teal)" : "var(--rc-muted)",
                }}>
                  {e.estado}
                </span>
              </div>
              <div style={{ color: "var(--rc-muted)", fontSize: 13 }}>
                Organizador: {e.emailOrganizador}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <Link
                href={`/admin/entrenamientos/${e.codigoEntrenamiento}`}
                style={{
                  background: "var(--rc-grad)",
                  border: "none",
                  color: "#fff",
                  padding: "8px 16px",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  textDecoration: "none",
                }}
              >
                Editar
              </Link>
              <AdminEntrenamientoActions id={e.codigoEntrenamiento} />
            </div>
          </div>
        ))}

        {rows.length === 0 && (
          <div style={{ textAlign: "center", padding: 60, color: "var(--rc-muted)" }}>
            No hay entrenamientos registrados.
          </div>
        )}
      </div>

      <Pagination pagina={pagina} totalPaginas={totalPaginas} />
    </div>
  );
}
