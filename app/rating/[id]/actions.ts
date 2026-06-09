"use server";

import { db } from "@/lib/db";
import { calificacion, usuario, usuarioEntrenamiento } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { getServerSession } from "@/lib/auth-server";

/** Devuelve los participantes del entrenamiento, excluyendo al usuario de sesión */
export async function getParticipantes(codigoEntrenamiento: number) {
  const session = await getServerSession(await headers());
  //if (!session) throw new Error("No autenticado");

  const rows = await db
    .select({
      email: usuario.email,
      nombre: usuario.nombre,
      fotoPerfil: usuario.fotoPerfil,
    })
    .from(usuarioEntrenamiento)
    .innerJoin(usuario, eq(usuarioEntrenamiento.email, usuario.email))
    .where(eq(usuarioEntrenamiento.codigoEntrenamiento, codigoEntrenamiento));

const email =
  session?.user?.email ?? "test@test.com";

return rows.filter(
  (r) => r.email !== email
);
}

/** Devuelve las calificaciones que el usuario de sesión ya emitió en este entrenamiento */
export async function getCalificacionesEmitidas(codigoEntrenamiento: number) {
  const session = await getServerSession(await headers());
  //if (!session) throw new Error("No autenticado");

  const email =
  session?.user?.email ?? "test@test.com";

  return db
    .select({
      emailCalificado: calificacion.emailCalificado,
      puntaje: calificacion.puntaje,
      comentario: calificacion.comentario,
    })
    .from(calificacion)
    .where(
      and(
        eq(calificacion.emailCalificador, email),
        eq(calificacion.codigoEntrenamiento2, codigoEntrenamiento)
      )
    );
}

type CalificarInput = {
  emailCalificado: string;
  codigoEntrenamiento: number;
  puntaje: number;
  comentario: string | null;
};

export async function calificar(input: CalificarInput) {
  const session = await getServerSession(await headers());
  //if (!session) throw new Error("No autenticado");

  const emailCalificador = session?.user?.email ?? "test@test.com";

  // Validar puntaje
  if (input.puntaje < 1 || input.puntaje > 5) {
    throw new Error("El puntaje debe estar entre 1 y 5.");
  }

  // Verificar que ambos participaron en el mismo entrenamiento
  const [calificador, calificado] = await Promise.all([
    db
      .select()
      .from(usuarioEntrenamiento)
      .where(
        and(
          eq(usuarioEntrenamiento.codigoEntrenamiento, input.codigoEntrenamiento),
          eq(usuarioEntrenamiento.email, emailCalificador)
        )
      )
      .limit(1),
    db
      .select()
      .from(usuarioEntrenamiento)
      .where(
        and(
          eq(usuarioEntrenamiento.codigoEntrenamiento, input.codigoEntrenamiento),
          eq(usuarioEntrenamiento.email, input.emailCalificado)
        )
      )
      .limit(1),
  ]);

  if (!calificador.length) {
    throw new Error("No participaste en este entrenamiento.");
  }
  if (!calificado.length) {
    throw new Error("El usuario a calificar no participó en este entrenamiento.");
  }

  // Verificar que no haya calificación previa
  const previa = await db
    .select()
    .from(calificacion)
    .where(
      and(
        eq(calificacion.emailCalificador, emailCalificador),
        eq(calificacion.emailCalificado, input.emailCalificado),
        eq(calificacion.codigoEntrenamiento2, input.codigoEntrenamiento)
      )
    )
    .limit(1);

  if (previa.length > 0) {
    throw new Error("Ya calificaste a este participante en este entrenamiento.");
  }

  await db.insert(calificacion).values({
    emailCalificador,
    emailCalificado: input.emailCalificado,
    // El schema usa codigoEntrenamiento1 para el calificado y codigoEntrenamiento2 para el calificador
    codigoEntrenamiento1: input.codigoEntrenamiento,
    codigoEntrenamiento2: input.codigoEntrenamiento,
    puntaje: input.puntaje,
    comentario: input.comentario,
  });
}