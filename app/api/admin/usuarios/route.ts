import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { usuario } from "@/db/schema";
import { sql } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { headers } = await import("next/headers");
  const session = await getAdminSession(await headers());
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

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
    .orderBy(sql`${usuario.nombre} ASC`);

  return NextResponse.json({ data: users });
}
