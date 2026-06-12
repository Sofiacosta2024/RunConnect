import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { getAuth } from "@/lib/auth";
import { finalizar } from "@/services/entrenamientoService";

export async function PATCH(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{
      id: string;
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

  const { id } = await params;
  const codigoEntrenamiento = Number(id);

  if (Number.isNaN(codigoEntrenamiento)) {
    return NextResponse.json(
      { error: "ID inválido" },
      { status: 400 }
    );
  }

  try {
    const resultado = await finalizar(codigoEntrenamiento, session.user.email);
    return NextResponse.json(resultado);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Error al finalizar el entrenamiento",
      },
      { status: 409 }
    );
  }
}
