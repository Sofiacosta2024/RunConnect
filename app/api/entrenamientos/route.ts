import { NextResponse } from "next/server";

import {
  EntrenamientoValidationError,
  ValidationError,
  toApiErrorResponse,
} from "@/lib/api-errors";
import type { EntrenamientoCreateDto } from "@/lib/entrenamiento-dto";
import { getAuthenticatedOrganizerId } from "@/lib/organizer-auth";
import { crearEntrenamientoConChat, getAll } from "@/services/entrenamientoService";

export const runtime = "nodejs";

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

export async function GET() {
  try {
    const entrenamientos = await getAll();

    return NextResponse.json({ ok: true, data: entrenamientos });
  } catch (error) {
    return toApiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const organizerId = await getAuthenticatedOrganizerId(request.headers);
    const body = await readJsonBody(request);
    const fechaInicio = body.fechaInicio ?? body.fecha_inicio;
    const fechaFin = body.fechaFin ?? body.fecha_fin;
    const fechaLimiteInscripcion = body.fechaLimiteInscripcion ?? body.fecha_limite_inscripcion;

    const dto: EntrenamientoCreateDto = {
      codigoDeporte: String(body.codigoDeporte ?? ""),
      fechaInicio:
        fechaInicio === undefined || fechaInicio === null ? "" : String(fechaInicio),
      fechaFin: fechaFin === undefined || fechaFin === null ? "" : String(fechaFin),
      fechaLimiteInscripcion:
        fechaLimiteInscripcion === undefined || fechaLimiteInscripcion === null
          ? null
          : String(fechaLimiteInscripcion),
      estado: String(body.estado ?? "") as EntrenamientoCreateDto["estado"],
      puntoEncuentro: parseBodyLocation(body) ?? "",
      distanciaEstimada:
        body.distanciaEstimada === undefined || body.distanciaEstimada === null
          ? null
          : Number(body.distanciaEstimada),
      ritmoObjetivo:
        body.ritmoObjetivo === undefined || body.ritmoObjetivo === null
          ? null
          : String(body.ritmoObjetivo),
      codigoNivel: String(body.codigoNivel ?? ""),
      cupoMaximo:
        body.cupoMaximo === undefined || body.cupoMaximo === null
          ? null
          : Number(body.cupoMaximo),
    };

    if (dto.estado.trim().toLowerCase() !== "abierto") {
      throw new EntrenamientoValidationError(
        "estado debe ser 'abierto' al crear el entrenamiento."
      );
    }

    const entrenamiento = await crearEntrenamientoConChat(organizerId, {
      codigoDeporte: dto.codigoDeporte,
      fechaInicio: dto.fechaInicio,
      fechaFin: dto.fechaFin,
      fechaLimiteInscripcion: dto.fechaLimiteInscripcion ?? null,
      ubicacion: dto.puntoEncuentro,
      distanciaEstimada: dto.distanciaEstimada,
      ritmoObjetivo: dto.ritmoObjetivo,
      codigoNivel: dto.codigoNivel,
      cupoMaximo: dto.cupoMaximo,
    });

    return NextResponse.json({ ok: true, data: entrenamiento }, { status: 201 });
  } catch (error) {
    if (error instanceof EntrenamientoValidationError) {
      return toApiErrorResponse(error);
    }

    return toApiErrorResponse(error);
  }
}
