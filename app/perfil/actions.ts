"use server";

import { db } from "@/lib/db";
import { calificacion, usuario, usuarioEntrenamiento } from "@/db/schema";
import { and, avg, count, eq, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";

export type PerfilData = {
  email: string;
  nombre: string;
  fotoPerfil: string | null;
  ubicacion: string | null;
  codigoDeporte: string | null;
  promedioCalificacion: number | null;
  cantidadCalificaciones: number;
  entrenamientosOrganizados: number;
  entrenamientosParticipados: number;
};

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

  // Promedio y cantidad de calificaciones recibidas
  const [stats] = await db
    .select({
      promedio: avg(calificacion.puntaje),
      cantidad: count(calificacion.puntaje),
    })
    .from(calificacion)
    .where(eq(calificacion.emailCalificado, email));

  // Entrenamientos organizados y participados
  const participaciones = await db
    .select({ rol: usuarioEntrenamiento.rol })
    .from(usuarioEntrenamiento)
    .where(eq(usuarioEntrenamiento.email, email));

  const organizados = participaciones.filter((p) => p.rol === "organizador").length;
  const participados = participaciones.filter((p) => p.rol === "participante").length;

  return {
    ...perfil,
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

  const ubicacion = data.ubicacion?.trim() || null;
  const codigoDeporte = data.codigoDeporte?.trim() || null;

  await db
    .update(usuario)
    .set({ ubicacion, codigoDeporte })
    .where(eq(usuario.email, session.user.email));
}