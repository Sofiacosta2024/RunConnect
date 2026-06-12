import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { usuario } from "@/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET() {
  const { headers } = await import("next/headers");
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.email) {
    return NextResponse.json({ rol: null });
  }

  const [user] = await db
    .select({ rol: usuario.rol })
    .from(usuario)
    .where(eq(usuario.email, session.user.email))
    .limit(1);

  return NextResponse.json({ rol: user?.rol ?? "usuario" });
}
