import { NextResponse } from "next/server";
import { eq, asc } from "drizzle-orm";

import { db } from "@/lib/db";
import { mensaje, usuario, usuarioEntrenamiento } from "@/db/schema";
import { ValidationError, toApiErrorResponse } from "@/lib/api-errors";
import { getServerSession } from "@/lib/auth-server";

export const runtime = "nodejs";

function parsePositiveInteger(value: string, fieldName: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ValidationError(`${fieldName} debe ser un entero positivo.`);
  }
  return parsed;
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const codigoEntrenamiento = parsePositiveInteger(id, "id");

    const mensajes = await db
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

    return NextResponse.json({ ok: true, data: mensajes });
  } catch (error) {
    return toApiErrorResponse(error);
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const codigoEntrenamiento = parsePositiveInteger(id, "id");

    const session = await getServerSession(request.headers);
    if (!session) {
      return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    if (!body || typeof body !== "object") {
      throw new ValidationError("El cuerpo de la solicitud debe ser un objeto JSON valido.");
    }

    const contenido = body.contenido;
    if (typeof contenido !== "string" || !contenido.trim()) {
      throw new ValidationError("El campo 'contenido' es requerido y debe ser un string.");
    }

    const participacion = await db
      .select()
      .from(usuarioEntrenamiento)
      .where(eq(usuarioEntrenamiento.codigoEntrenamiento, codigoEntrenamiento))
      .then((rows) => rows.find((r) => r.email === session.user.email));

    if (!participacion) {
      return NextResponse.json(
        { ok: false, error: "No sos participante de este entrenamiento" },
        { status: 403 }
      );
    }

    // Ya no necesitás calcular fecha y hora por separado — defaultNow() lo maneja
    await db.insert(mensaje).values({
      codigoEntrenamiento,
      email: session.user.email,
      contenido: contenido.trim(),
      // creadoEn: se omite porque tiene .defaultNow() en el schema
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    return toApiErrorResponse(error);
  }
}