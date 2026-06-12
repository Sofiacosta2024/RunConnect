import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { usuario } from "@/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(
  _request: Request,
  context: { params: Promise<{ email: string }> }
) {
  const { headers } = await import("next/headers");
  const session = await getAdminSession(await headers());
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { email } = await context.params;
  const decodedEmail = decodeURIComponent(email);

  const [user] = await db
    .select({ email: usuario.email, suspendido: usuario.suspendido })
    .from(usuario)
    .where(eq(usuario.email, decodedEmail))
    .limit(1);

  if (!user) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  const newSuspendido = !user.suspendido;

  await db
    .update(usuario)
    .set({ suspendido: newSuspendido })
    .where(eq(usuario.email, decodedEmail));

  return NextResponse.json({
    ok: true,
    data: { email: decodedEmail, suspendido: newSuspendido },
  });
}
