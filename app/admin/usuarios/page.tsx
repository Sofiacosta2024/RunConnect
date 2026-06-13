import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { usuario } from "@/db/schema";
import { count, sql } from "drizzle-orm";
import UsuarioActions from "./UsuarioActions";
import Pagination from "@/app/components/Pagination";

export const dynamic = "force-dynamic";

const LIMITE = 15;

export default async function AdminUsuariosPage(props: { searchParams: Promise<{ pagina?: string }> }) {
  const session = await getAdminSession(await headers());
  if (!session) redirect("/login");

  const { pagina: rawPagina } = await props.searchParams;
  const pagina = Math.max(1, Number(rawPagina) || 1);
  const offset = (pagina - 1) * LIMITE;

  const [countRow] = await db
    .select({ total: count() })
    .from(usuario);

  const total = Number(countRow?.total ?? 0);
  const totalPaginas = Math.ceil(total / LIMITE);

  const users = await db
    .select({
      email: usuario.email,
      nombre: usuario.nombre,
      fotoPerfil: usuario.fotoPerfil,
      ubicacion: usuario.ubicacion,
      rol: usuario.rol,
      suspendido: usuario.suspendido,
    })
    .from(usuario)
    .orderBy(sql`${usuario.nombre} ASC`)
    .limit(LIMITE)
    .offset(offset);

  const activeCount = users.filter((u) => !u.suspendido).length;
  const suspendedCount = users.filter((u) => u.suspendido).length;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, letterSpacing: "2px", marginBottom: 8 }}>
            Usuarios
          </h1>
          <p style={{ color: "var(--rc-muted)", fontSize: 15 }}>
            Total: {total} usuarios.
          </p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {users.map((u) => (
          <div
            key={u.email}
            style={{
              background: "var(--rc-card)",
              border: "1px solid var(--rc-border)",
              borderRadius: 12,
              padding: "16px 20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
              opacity: u.suspendido ? 0.6 : 1,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: u.fotoPerfil ? `url(${u.fotoPerfil}) center/cover` : "var(--rc-muted)",
                  flexShrink: 0,
                }}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{u.nombre}</div>
                <div style={{ color: "var(--rc-muted)", fontSize: 13 }}>{u.email}</div>
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.8px",
                  padding: "3px 10px",
                  borderRadius: 100,
                  border: "1px solid",
                  borderColor: u.rol === "admin" ? "var(--rc-teal)" : "var(--rc-border)",
                  color: u.rol === "admin" ? "var(--rc-teal)" : "var(--rc-muted)",
                }}
              >
                {u.rol}
              </span>
              {u.suspendido && (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.8px",
                    padding: "3px 10px",
                    borderRadius: 100,
                    border: "1px solid #e74c3c",
                    color: "#e74c3c",
                  }}
                >
                  Suspendido
                </span>
              )}
            </div>

            <UsuarioActions email={u.email} suspendido={u.suspendido ?? false} />
          </div>
        ))}

        {users.length === 0 && (
          <div style={{ textAlign: "center", padding: 60, color: "var(--rc-muted)" }}>
            No hay usuarios registrados.
          </div>
        )}
      </div>

      <Pagination pagina={pagina} totalPaginas={totalPaginas} />
    </div>
  );
}
