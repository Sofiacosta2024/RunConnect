import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { getAuth } from "@/lib/auth";
import * as solicitudService from "@/services/solicitudService";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = getAuth();

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.email) {
    return NextResponse.json(
      { error: "No autenticado" },
      { status: 401 }
    );
  }

  const { id } = await params;

  try {
    const solicitud = await solicitudService.crearSolicitud(
      session.user.email,
      Number(id)
    );

    return NextResponse.json(solicitud, {
      status: 201,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Error al crear la solicitud",
      },
      { status: 409 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = getAuth();

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.email) {
    return NextResponse.json(
      { error: "No autenticado" },
      { status: 401 }
    );
  }

  const { id } = await params;

  const status =
    request.nextUrl.searchParams.get("status") ?? undefined;

  try {
    const solicitudes =
      await solicitudService.obtenerSolicitudes(
        session.user.email,
        Number(id),
        status
      );

    return NextResponse.json(solicitudes);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Error al obtener solicitudes",
      },
      { status: 400 }
    );
  }
}