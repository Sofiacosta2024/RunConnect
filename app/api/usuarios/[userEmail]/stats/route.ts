import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { calificacion, usuario, usuarioEntrenamiento } from "@/db/schema";
import { avg, count, eq } from "drizzle-orm";
import { getAuthenticatedOrganizerEmail } from "@/lib/organizer-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userEmail: string }> }
) {
  try {
    await getAuthenticatedOrganizerEmail(request.headers);
  } catch {
    return NextResponse.json({ code: "UNAUTHORIZED" }, { status: 401 });
  }

  const { userEmail } = await params;
  const email = decodeURIComponent(userEmail);

  const [perfil] = await db
    .select({ email: usuario.email })
    .from(usuario)
    .where(eq(usuario.email, email))
    .limit(1);

  if (!perfil) {
    return NextResponse.json({ code: "USER_NOT_FOUND" }, { status: 404 });
  }

  const [stats] = await db
    .select({
      promedio: avg(calificacion.puntaje),
      cantidad: count(calificacion.puntaje),
    })
    .from(calificacion)
    .where(eq(calificacion.emailCalificado, email));

  const participaciones = await db
    .select({ rol: usuarioEntrenamiento.rol })
    .from(usuarioEntrenamiento)
    .where(eq(usuarioEntrenamiento.email, email));

  return NextResponse.json({
    userEmail: email,
    trainingsOrganized: participaciones.filter((p) => p.rol === "organizador").length,
    trainingsParticipated: participaciones.filter((p) => p.rol === "participante").length,
    averageRating: stats.promedio
      ? Math.round(Number(stats.promedio) * 10) / 10
      : null,
    ratingsCount: Number(stats.cantidad),
  });
}