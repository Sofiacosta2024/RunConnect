import { NextResponse } from "next/server";

import { ValidationError, toApiErrorResponse } from "@/lib/api-errors";
import { getAuthenticatedOrganizerId } from "@/lib/organizer-auth";
import { create, getAll } from "@/services/entrenamientoService";

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

    const entrenamiento = await create(organizerId, {
      codigoDeporte: String(body.codigoDeporte ?? ""),
      fecha: String(body.fecha ?? ""),
      hora: String(body.hora ?? ""),
      fechaInicio:
        fechaInicio === undefined || fechaInicio === null ? undefined : String(fechaInicio),
      fechaFin: fechaFin === undefined || fechaFin === null ? undefined : String(fechaFin),
      fechaLimiteInscripcion:
        fechaLimiteInscripcion === undefined || fechaLimiteInscripcion === null
          ? null
          : String(fechaLimiteInscripcion),
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

    return NextResponse.json({ ok: true, data: entrenamiento }, { status: 201 });
  } catch (error) {
    return toApiErrorResponse(error);
  }
}
