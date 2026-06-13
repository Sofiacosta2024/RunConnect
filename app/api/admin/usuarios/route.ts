import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { usuario } from "@/db/schema";
import { count, sql } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { headers } = await import("next/headers");
  const session = await getAdminSession(await headers());
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const rawPagina = searchParams.get("pagina");
  const rawLimite = searchParams.get("limite");
  const pagina = rawPagina ? Math.max(1, Number(rawPagina)) : undefined;
  const limite = rawLimite ? Math.max(1, Number(rawLimite)) : 15;
  const offset = pagina !== undefined ? (pagina - 1) * limite : undefined;

  const [countRow] = await db
    .select({ total: count() })
    .from(usuario);

  const total = Number(countRow?.total ?? 0);
  const totalPaginas = Math.ceil(total / limite);

  const baseQuery = db
    .select({
      email: usuario.email,
      nombre: usuario.nombre,
      fotoPerfil: usuario.fotoPerfil,
      ubicacion: usuario.ubicacion,
      rol: usuario.rol,
      suspendido: usuario.suspendido,
    })
    .from(usuario)
    .orderBy(sql`${usuario.nombre} ASC`);

  const users = pagina !== undefined
    ? await (baseQuery as any).limit(limite).offset(offset!)
    : await baseQuery;

  return NextResponse.json({ data: users, total, pagina: pagina ?? 1, totalPaginas });
}
