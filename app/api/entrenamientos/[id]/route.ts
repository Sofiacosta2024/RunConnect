import { NextResponse } from "next/server";

import { ForbiddenError, NotFoundError, ValidationError, toApiErrorResponse } from "@/lib/api-errors";
import { getAuthenticatedOrganizerId } from "@/lib/organizer-auth";
import { getById, remove, update } from "@/services/entrenamientoService";

export const runtime = "nodejs";

function parsePositiveInteger(value: string, fieldName: string) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ValidationError(`${fieldName} debe ser un entero positivo.`);
  }

  return parsed;
}

function parseBodyLocation(body: Record<string, unknown>) {
  return (body.ubicacion ?? body.puntoEncuentro ?? body.punto_de_encuentro) as
    | string
    | { latitude: number; longitude: number }
    | { lat: number; lng: number }
    | undefined;
}

async function readJsonBody(request: Request) {
  const body = (await request.json()) as Record<string, unknown>;

  if (!body || typeof body !== "object") {
    throw new ValidationError("El cuerpo de la solicitud debe ser un objeto JSON valido.");
  }

  return body;
}

async function authorizeTraining(request: Request, codigoEntrenamiento: number) {
  const organizerId = await getAuthenticatedOrganizerId(request.headers);
  const entrenamiento = await getById(codigoEntrenamiento);

  if (!entrenamiento) {
    throw new NotFoundError("Entrenamiento no encontrado.");
  }

  if (entrenamiento.idOrganizador !== organizerId) {
    throw new ForbiddenError();
  }

  return organizerId;
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const codigoEntrenamiento = parsePositiveInteger(id, "id");
    const entrenamiento = await getById(codigoEntrenamiento);

    if (!entrenamiento) {
      throw new NotFoundError("Entrenamiento no encontrado.");
    }

    return NextResponse.json({ ok: true, data: entrenamiento });
  } catch (error) {
    return toApiErrorResponse(error);
  }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const codigoEntrenamiento = parsePositiveInteger(id, "id");

    await authorizeTraining(request, codigoEntrenamiento);

    const body = await readJsonBody(request);

    const entrenamiento = await update(codigoEntrenamiento, {
      codigoDeporte: String(body.codigoDeporte ?? ""),
      fecha: String(body.fecha ?? ""),
      hora: String(body.hora ?? ""),
      ubicacion: parseBodyLocation(body) ?? "",
      distanciaEstimada:
        body.distanciaEstimada === undefined || body.distanciaEstimada === null
          ? null
          : Number(body.distanciaEstimada),
      ritmoObjetivo: body.ritmoObjetivo === undefined || body.ritmoObjetivo === null ? null : String(body.ritmoObjetivo),
      codigoNivel: String(body.codigoNivel ?? ""),
      cupoMaximo:
        body.cupoMaximo === undefined || body.cupoMaximo === null ? null : Number(body.cupoMaximo),
    });

    return NextResponse.json({ ok: true, data: entrenamiento });
  } catch (error) {
    return toApiErrorResponse(error);
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const codigoEntrenamiento = parsePositiveInteger(id, "id");

    await authorizeTraining(request, codigoEntrenamiento);

    const result = await remove(codigoEntrenamiento);

    return NextResponse.json({ ok: true, data: result });
  } catch (error) {
    return toApiErrorResponse(error);
  }
}
