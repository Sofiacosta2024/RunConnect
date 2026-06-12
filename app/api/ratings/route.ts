// app/api/ratings/route.ts

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { calificacion, usuario, entrenamiento, usuarioEntrenamiento } from "@/db/schema";
import { and, avg, count, desc, eq } from "drizzle-orm";
import { getAuthenticatedOrganizerEmail } from "@/lib/organizer-auth";
import {
  BusinessRuleError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
  toApiErrorResponse,
} from "@/lib/api-errors";

export const runtime = "nodejs";

// ---------------------------------------------------------------------------
// GET /api/ratings?email=<emailCalificado>
// Devuelve promedio, total de calificaciones y el detalle de cada una.
// ---------------------------------------------------------------------------
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email")?.trim();

    if (!email || !email.includes("@")) {
      throw new ValidationError("Debes proporcionar un email válido en el query param 'email'.");
    }

    // Verificar que el usuario existe
    const [usuarioRow] = await db
      .select({ email: usuario.email, nombre: usuario.nombre, fotoPerfil: usuario.fotoPerfil })
      .from(usuario)
      .where(eq(usuario.email, email))
      .limit(1);

    if (!usuarioRow) {
      throw new NotFoundError("Usuario no encontrado.");
    }

    // Promedio y cantidad total
    const [stats] = await db
      .select({
        promedio: avg(calificacion.puntaje),
        total: count(calificacion.puntaje),
      })
      .from(calificacion)
      .where(eq(calificacion.emailCalificado, email));

    // Detalle: cada calificación con datos del calificador y del entrenamiento
    const detalle = await db
      .select({
        puntaje: calificacion.puntaje,
        comentario: calificacion.comentario,
        codigoEntrenamiento: calificacion.codigoEntrenamiento1,
        emailCalificador: calificacion.emailCalificador,
        nombreCalificador: usuario.nombre,
        fotoCalificador: usuario.fotoPerfil,
        fechaEntrenamiento: entrenamiento.fechaInicio,
        deporte: entrenamiento.codigoDeporte,
      })
      .from(calificacion)
      .innerJoin(usuario, eq(calificacion.emailCalificador, usuario.email))
      .innerJoin(entrenamiento, eq(calificacion.codigoEntrenamiento1, entrenamiento.codigoEntrenamiento))
      .where(eq(calificacion.emailCalificado, email))
      .orderBy(desc(entrenamiento.fechaInicio));

    return NextResponse.json({
      ok: true,
      data: {
        usuario: usuarioRow,
        promedio: stats.promedio ? Number(Number(stats.promedio).toFixed(2)) : null,
        total: Number(stats.total),
        calificaciones: detalle,
      },
    });
  } catch (error) {
    return toApiErrorResponse(error);
  }
}

// ---------------------------------------------------------------------------
// POST /api/ratings
// Body: { emailCalificado, codigoEntrenamiento, puntaje, comentario? }
// El calificador se obtiene de la sesión autenticada.
// ---------------------------------------------------------------------------
export async function POST(request: Request) {
  try {
    const emailCalificador = await getAuthenticatedOrganizerEmail(request.headers);

    const body = (await request.json()) as Record<string, unknown>;

    const emailCalificado = String(body.emailCalificado ?? "").trim();
    const codigoEntrenamiento = Number(body.codigoEntrenamiento);
    const puntaje = Number(body.puntaje);
    const comentario =
      body.comentario !== undefined && body.comentario !== null
        ? String(body.comentario).trim()
        : null;

    // --- Validaciones básicas ---
    if (!emailCalificado || !emailCalificado.includes("@")) {
      throw new ValidationError("emailCalificado debe ser un email válido.");
    }
    if (!Number.isInteger(codigoEntrenamiento) || codigoEntrenamiento <= 0) {
      throw new ValidationError("codigoEntrenamiento debe ser un entero positivo.");
    }
    if (!Number.isInteger(puntaje) || puntaje < 1 || puntaje > 5) {
      throw new ValidationError("puntaje debe ser un entero entre 1 y 5.");
    }
    if (emailCalificado === emailCalificador) {
      throw new BusinessRuleError("No podés calificarte a vos mismo.");
    }

    // --- Verificar que el entrenamiento existe y está finalizado ---
    const [entrenamientoRow] = await db
      .select({ estado: entrenamiento.estado })
      .from(entrenamiento)
      .where(eq(entrenamiento.codigoEntrenamiento, codigoEntrenamiento))
      .limit(1);

    if (!entrenamientoRow) {
      throw new NotFoundError("Entrenamiento no encontrado.");
    }
    if (entrenamientoRow.estado !== "finalizado") {
      throw new BusinessRuleError(
        "Solo podés calificar participantes de entrenamientos finalizados."
      );
    }

    // --- Verificar participación de ambos en el entrenamiento ---
    const [partCalificador, partCalificado] = await Promise.all([
      db
        .select({ email: usuarioEntrenamiento.email })
        .from(usuarioEntrenamiento)
        .where(
          and(
            eq(usuarioEntrenamiento.codigoEntrenamiento, codigoEntrenamiento),
            eq(usuarioEntrenamiento.email, emailCalificador)
          )
        )
        .limit(1),
      db
        .select({ email: usuarioEntrenamiento.email })
        .from(usuarioEntrenamiento)
        .where(
          and(
            eq(usuarioEntrenamiento.codigoEntrenamiento, codigoEntrenamiento),
            eq(usuarioEntrenamiento.email, emailCalificado)
          )
        )
        .limit(1),
    ]);

    if (!partCalificador.length) {
      throw new BusinessRuleError("No participaste en este entrenamiento.");
    }
    if (!partCalificado.length) {
      throw new BusinessRuleError(
        "El usuario a calificar no participó en este entrenamiento."
      );
    }

    // --- Verificar que no haya calificación previa ---
    const [previa] = await db
      .select({ emailCalificado: calificacion.emailCalificado })
      .from(calificacion)
      .where(
        and(
          eq(calificacion.emailCalificador, emailCalificador),
          eq(calificacion.emailCalificado, emailCalificado),
          eq(calificacion.codigoEntrenamiento2, codigoEntrenamiento)
        )
      )
      .limit(1);

    if (previa) {
      throw new BusinessRuleError(
        "Ya calificaste a este participante en este entrenamiento."
      );
    }

    // --- Insertar calificación ---
    // codigoEntrenamiento1 → FK (emailCalificado, entrenamiento)
    // codigoEntrenamiento2 → FK (emailCalificador, entrenamiento)
    // Ambos son el mismo entrenamiento.
    await db.insert(calificacion).values({
      emailCalificado,
      codigoEntrenamiento1: codigoEntrenamiento,
      emailCalificador,
      codigoEntrenamiento2: codigoEntrenamiento,
      puntaje,
      comentario,
    });

    return NextResponse.json(
      { ok: true, message: "Calificación registrada exitosamente." },
      { status: 201 }
    );
  } catch (error) {
    return toApiErrorResponse(error);
  }
}