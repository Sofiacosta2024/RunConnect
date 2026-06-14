import { NextResponse } from "next/server";
import * as solicitudService from "@/services/solicitudService";
import { cerrarVencidos, finalizarVencidos } from "@/services/entrenamientoService";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");

  if (
    auth !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const [rechazadas, cerradas, finalizadas] = await Promise.all([
    solicitudService.rechazarSolicitudesExpiradas(),
    cerrarVencidos(),
    finalizarVencidos(),
  ]);

  return NextResponse.json({
    ok: true,
    rechazadas,
    cerradas,
    finalizadas,
  });
}