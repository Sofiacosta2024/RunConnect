import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { getAuth } from "@/lib/auth";
import * as solicitudService from "@/services/solicitudService";
import { revalidatePath } from "next/cache";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; requestId: string }> }) {

}

export async function PATCH(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      id: string;
      requestId: string;
    }>;
  }
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

  const { requestId } = await params;

  try {
    const resultado = await solicitudService.aceptarSolicitud(
      session.user.email,
      Number(requestId)
    );

    revalidatePath("https://runconnect-eight.vercel.app/solicitudes"); 

    return NextResponse.json(resultado);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Error al aceptar la solicitud",
      },
      { status: 409 }
    );
  }
}