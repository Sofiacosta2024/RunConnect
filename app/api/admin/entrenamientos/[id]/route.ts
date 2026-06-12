import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { update } from "@/services/entrenamientoService";
import { NotFoundError, ValidationError, EntrenamientoValidationError } from "@/lib/api-errors";

export const runtime = "nodejs";

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { headers } = await import("next/headers");
    const session = await getAdminSession(await headers());
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await context.params;
    const codigo = Number(id);
    if (isNaN(codigo)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const body = await request.json() as Record<string, unknown>;

    const result = await update(codigo, {
      codigoDeporte: String(body.codigoDeporte ?? ""),
      fechaInicio: String(body.fechaInicio ?? ""),
      fechaFin: String(body.fechaFin ?? ""),
      estado: String(body.estado ?? ""),
      puntoEncuentro: (body.puntoEncuentro ?? "") as string | { latitude: number; longitude: number },
      distanciaEstimada: body.distanciaEstimada === null ? null : Number(body.distanciaEstimada),
      ritmoObjetivo: body.ritmoObjetivo === null ? null : String(body.ritmoObjetivo),
      nivel: String(body.nivel ?? ""),
      cupoMaximo: body.cupoMaximo === null ? null : Number(body.cupoMaximo),
    });

    return NextResponse.json({ ok: true, data: result });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof ValidationError || error instanceof EntrenamientoValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error interno" },
      { status: 500 }
    );
  }
}
