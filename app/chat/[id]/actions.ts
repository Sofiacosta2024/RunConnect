// app/chat/[id]/actions.ts
"use server";

import { db } from "@/lib/db";
import { mensaje, usuario } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { headers } from "next/headers";
import { getServerSession } from "@/lib/auth-server";

export async function getMensajes(codigoEntrenamiento: number) {
  return db
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
    .orderBy(asc(mensaje.creadoEn));
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