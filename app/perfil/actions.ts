"use server";

import { db } from "@/lib/db";
import { calificacion, usuario, usuarioEntrenamiento } from "@/db/schema";
import { avg, count, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";

export type PerfilData = {
  email: string;
  nombre: string;
  fotoPerfil: string | null;
  ubicacion: string | null;
  ubicacionDisplay: string | null;
  codigoDeporte: string | null;
  promedioCalificacion: number | null;
  cantidadCalificaciones: number;
  entrenamientosOrganizados: number;
  entrenamientosParticipados: number;
};

function parseUbicacionDisplay(ubicacion: string | null): string | null {
  if (!ubicacion) return null;
  if (ubicacion.includes("|")) return ubicacion.split("|")[1];
  return ubicacion;
}

export async function getPerfilPropio(): Promise<PerfilData> {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.email) throw new Error("No autenticado");

  const email = session.user.email;

  const [perfil] = await db
    .select({
      email: usuario.email,
      nombre: usuario.nombre,
      fotoPerfil: usuario.fotoPerfil,
      ubicacion: usuario.ubicacion,
      codigoDeporte: usuario.codigoDeporte,
    })
    .from(usuario)
    .where(eq(usuario.email, email))
    .limit(1);

  if (!perfil) throw new Error("Usuario no encontrado");

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

  const organizados = participaciones.filter((p) => p.rol === "organizador").length;
  const participados = participaciones.filter((p) => p.rol === "participante").length;

  return {
    ...perfil,
    ubicacionDisplay: parseUbicacionDisplay(perfil.ubicacion),
    promedioCalificacion: stats.promedio ? Math.round(Number(stats.promedio) * 10) / 10 : null,
    cantidadCalificaciones: Number(stats.cantidad),
    entrenamientosOrganizados: organizados,
    entrenamientosParticipados: participados,
  };
}

export async function actualizarPerfil(data: {
  ubicacion: string | null;
  codigoDeporte: string | null;
}): Promise<void> {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.email) throw new Error("No autenticado");

  const codigoDeporte = data.codigoDeporte?.trim() || null;
  let ubicacion: string | null = null;

  if (data.ubicacion?.trim()) {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(data.ubicacion.trim())}&format=json&limit=1`;
    const res = await fetch(url, {
      headers: { "User-Agent": "RunConnect/1.0" },
    });
    const json = await res.json();
    if (!json || json.length === 0) {
      throw new Error("No se encontró la dirección. Intentá ser más específico.");
    }
    ubicacion = `${json[0].lat},${json[0].lon}|${data.ubicacion.trim()}`;
  }

  await db
    .update(usuario)
    .set({ ubicacion, codigoDeporte })
    .where(eq(usuario.email, session.user.email));
}