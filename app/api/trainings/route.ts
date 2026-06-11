import { headers } from "next/headers";
import { NextResponse } from "next/server";

import {
  EntrenamientoValidationError,
  ValidationError,
  toApiErrorResponse,
} from "@/lib/api-errors";
import type { EntrenamientoCreateDto } from "@/lib/entrenamiento-dto";
import { getAuthenticatedOrganizerEmail } from "@/lib/organizer-auth";
import { crearEntrenamientoConChat, getAll, getFiltered } from "@/services/entrenamientoService";
import { getAuth } from "@/lib/auth";

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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawDeporte = searchParams.get("deporte");
    const rawNivel = searchParams.get("nivel");
    const rawFecha = searchParams.get("fecha");
    const rawLat = searchParams.get("lat");
    const rawLng = searchParams.get("lng");
    const rawRadio = searchParams.get("radio");

    const deporte = rawDeporte?.trim() || undefined;
    const nivel = rawNivel?.trim() || undefined;
    const fecha = rawFecha?.trim() || undefined;
    const lat = rawLat ? Number(rawLat) : undefined;
    const lng = rawLng ? Number(rawLng) : undefined;
    const radioKm = rawRadio ? Number(rawRadio) : undefined;

    // Obtener el email del usuario logueado (opcional — puede no estar autenticado)
    const auth = getAuth();
    const session = await auth.api.getSession({ headers: await headers() });
    const emailUsuario = session?.user?.email ?? "";

    if (!deporte && !nivel && !fecha && lat === undefined && lng === undefined) {
      const entrenamientos = await getAll();
      return NextResponse.json({ ok: true, data: entrenamientos });
    }

    const entrenamientos = await getFiltered({
      codigoDeporte: deporte,
      nivel,
      fecha,
      lat,
      lng,
      radioKm,
      emailUsuario,
    });

    return NextResponse.json({ ok: true, data: entrenamientos });
  } catch (error) {
    return toApiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const organizerEmail = await getAuthenticatedOrganizerEmail(request.headers);
    const body = await readJsonBody(request);
    const fechaInicio = body.fechaInicio ?? body.fecha_inicio;
    const fechaFin = body.fechaFin ?? body.fecha_fin;
    const nivel = body.nivel ?? body.codigoNivel ?? body.codigo_nivel;

    const dto: EntrenamientoCreateDto = {
      codigoDeporte: String(body.codigoDeporte ?? ""),
      fechaInicio: fechaInicio === undefined || fechaInicio === null ? "" : String(fechaInicio),
      fechaFin: fechaFin === undefined || fechaFin === null ? "" : String(fechaFin),
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
      nivel: nivel === undefined || nivel === null ? "" : String(nivel),
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

    const entrenamiento = await crearEntrenamientoConChat(organizerEmail, {
      codigoDeporte: dto.codigoDeporte,
      fechaInicio: dto.fechaInicio,
      fechaFin: dto.fechaFin,
      puntoEncuentro: dto.puntoEncuentro,
      distanciaEstimada: dto.distanciaEstimada,
      ritmoObjetivo: dto.ritmoObjetivo,
      nivel: dto.nivel,
      cupoMaximo: dto.cupoMaximo,
    });

    return NextResponse.json({ ok: true, data: entrenamiento }, { status: 201 });
  } catch (error) {
    return toApiErrorResponse(error);
  }
}