import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { calificacion, usuario } from "@/db/schema";
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
    .select({
      email: usuario.email,
      nombre: usuario.nombre,
      fotoPerfil: usuario.fotoPerfil,
      codigoDeporte: usuario.codigoDeporte,
    })
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

  return NextResponse.json({
    email: perfil.email,
    fullName: perfil.nombre,
    profilePicture: perfil.fotoPerfil,
    preferredSport: perfil.codigoDeporte,
    averageRating: stats.promedio
      ? Math.round(Number(stats.promedio) * 10) / 10
      : null,
    ratingsCount: Number(stats.cantidad),
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userEmail: string }> }
) {
  let requesterEmail: string;
  try {
    requesterEmail = await getAuthenticatedOrganizerEmail(request.headers);
  } catch {
    return NextResponse.json({ code: "UNAUTHORIZED" }, { status: 401 });
  }

  const { userEmail } = await params;
  const email = decodeURIComponent(userEmail);

  if (requesterEmail !== email) {
    return NextResponse.json({ code: "FORBIDDEN" }, { status: 403 });
  }

  const body = await request.json();
  const { preferredSport, location } = body;

  const codigoDeporte = preferredSport?.trim() || null;
  let ubicacion: string | null = null;

  if (location?.trim()) {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location.trim())}&format=json&limit=1`;
    const res = await fetch(url, { headers: { "User-Agent": "RunConnect/1.0" } });
    const json = await res.json();
    if (!json || json.length === 0) {
      return NextResponse.json({ code: "LOCATION_NOT_FOUND" }, { status: 400 });
    }
    ubicacion = `${json[0].lat},${json[0].lon}|${location.trim()}`;
  }

  await db
    .update(usuario)
    .set({ ubicacion, codigoDeporte })
    .where(eq(usuario.email, email));

  const [actualizado] = await db
    .select({
      email: usuario.email,
      nombre: usuario.nombre,
      fotoPerfil: usuario.fotoPerfil,
      codigoDeporte: usuario.codigoDeporte,
    })
    .from(usuario)
    .where(eq(usuario.email, email))
    .limit(1);

  return NextResponse.json({
    email: actualizado.email,
    fullName: actualizado.nombre,
    profilePicture: actualizado.fotoPerfil,
    preferredSport: actualizado.codigoDeporte,
  });
}