// app/chat/[id]/actions.ts
"use server";

import { db } from "@/lib/db";
import { mensaje, usuario } from "@/db/schema";
import { eq, asc, desc, count } from "drizzle-orm";
import { headers } from "next/headers";
import { getServerSession } from "@/lib/auth-server";

export async function getMensajes(codigoEntrenamiento: number, pagina: number = 1, limite: number = 50) {
  const [countRow] = await db
    .select({ total: count() })
    .from(mensaje)
    .where(eq(mensaje.codigoEntrenamiento, codigoEntrenamiento));

  const total = Number(countRow?.total ?? 0);
  const totalPaginas = Math.ceil(total / limite);
  const offset = (pagina - 1) * limite;

  // Load most recent messages first, then reverse for display
  const rows = await db
    .select({
      codigoMensaje: mensaje.codigoMensaje,
      contenido: mensaje.contenido,
      creadoEn: mensaje.creadoEn,
      email: mensaje.email,
      nombre: usuario.nombre,
      fotoPerfil: usuario.fotoPerfil,
    })
    .from(mensaje)
    .innerJoin(usuario, eq(mensaje.email, usuario.email))
    .where(eq(mensaje.codigoEntrenamiento, codigoEntrenamiento))
    .orderBy(desc(mensaje.creadoEn))
    .limit(limite)
    .offset(offset);

  return {
    messages: rows.reverse(),
    total,
    totalPaginas,
    pagina,
    hasMore: pagina < totalPaginas,
  };
}

export async function enviarMensaje(codigoEntrenamiento: number, contenido: string) {
  const session = await getServerSession(await headers());
  //if (!session) throw new Error("No autenticado");

  const texto = contenido.trim();
  if (!texto || texto.length > 500) throw new Error("Mensaje inválido");

  await db.insert(mensaje).values({
    codigoEntrenamiento,
    email: session?.user?.email ?? "test@test.com",
    contenido: texto,
  });
}