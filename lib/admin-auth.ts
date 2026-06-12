import "server-only";

import { getAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { usuario } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getAdminSession(headers: Headers) {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers });

  if (!session?.user?.email) return null;

  const [user] = await db
    .select({ rol: usuario.rol })
    .from(usuario)
    .where(eq(usuario.email, session.user.email))
    .limit(1);

  if (!user || user.rol !== "admin") return null;

  return session;
}

export async function requireAdmin(headers: Headers) {
  const session = await getAdminSession(headers);
  if (!session) {
    const { redirect } = await import("next/navigation");
    redirect("/login");
  }
  return session;
}
