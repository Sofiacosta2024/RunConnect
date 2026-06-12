"use server";

import { db } from "@/lib/db";
import { entrenamiento, usuarioEntrenamiento, usuario } from "@/db/schema";
import { and, eq, notInArray, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { getServerSession } from "@/lib/auth-server";

export type EntrenamientoSugerido = {
  codigoEntrenamiento: number;
  codigoDeporte: string;
  fechaInicio: Date;
  fechaFin: Date;
  nivel: string;
  distanciaEstimada: string | null;
  ritmoObjetivo: string | null;
  cupoMaximo: number | null;
  distanciaKm: number;
  organizadorNombre: string;
  organizadorFoto: string | null;
  cantParticipantes: number;
};

export type FiltrosSugerencias = {
  nivel: string;
  distanciaMaxKm: number;
};

function parseCoordenadas(ubicacion: string): { lat: number; lng: number } | null {
  // Formato: "lat,lng|texto" o "lat,lng"
  const raw = ubicacion.includes("|") ? ubicacion.split("|")[0] : ubicacion;
  const [lat, lng] = raw.split(",").map(Number);
  if (isNaN(lat) || isNaN(lng)) return null;
  return { lat, lng };
}

export async function getSugerencias(
  filtros: FiltrosSugerencias
): Promise<EntrenamientoSugerido[]> {
  const session = await getServerSession(await headers());
  if (!session) throw new Error("No autenticado");

  const [perfil] = await db
    .select({
      codigoDeporte: usuario.codigoDeporte,
      ubicacion: usuario.ubicacion,
    })
    .from(usuario)
    .where(eq(usuario.email, session.user.email))
    .limit(1);

  if (!perfil?.ubicacion) throw new Error("Configurá tu ubicación en tu perfil para recibir sugerencias.");
  if (!perfil?.codigoDeporte) throw new Error("Configurá tu deporte preferido en tu perfil para recibir sugerencias.");

  const coordenadas = parseCoordenadas(perfil.ubicacion);
  if (!coordenadas) throw new Error("Tu ubicación guardada no es válida. Actualizala desde tu perfil.");

  const { lat, lng } = coordenadas;

  const yaParticipa = await db
    .select({ codigo: usuarioEntrenamiento.codigoEntrenamiento })
    .from(usuarioEntrenamiento)
    .where(eq(usuarioEntrenamiento.email, session.user.email));

  const codigosExcluidos = yaParticipa.map((r) => r.codigo);

  const distanciaMaxMetros = filtros.distanciaMaxKm * 1000;
  const punto = sql`ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography`;

  const rows = await db
    .select({
      codigoEntrenamiento: entrenamiento.codigoEntrenamiento,
      codigoDeporte: entrenamiento.codigoDeporte,
      fechaInicio: entrenamiento.fechaInicio,
      fechaFin: entrenamiento.fechaFin,
      nivel: entrenamiento.nivel,
      distanciaEstimada: entrenamiento.distanciaEstimada,
      ritmoObjetivo: entrenamiento.ritmoObjetivo,
      cupoMaximo: entrenamiento.cupoMaximo,
      distanciaMetros: sql<number>`ST_Distance(${entrenamiento.puntoEncuentro}::geography, ${punto})`,
    })
    .from(entrenamiento)
    .where(
      and(
        eq(entrenamiento.codigoDeporte, perfil.codigoDeporte),
        eq(entrenamiento.nivel, filtros.nivel),
        eq(entrenamiento.estado, "abierto"),
        sql`ST_DWithin(${entrenamiento.puntoEncuentro}::geography, ${punto}, ${distanciaMaxMetros})`,
        sql`${entrenamiento.fechaInicio} > NOW()`,
        codigosExcluidos.length > 0
          ? notInArray(entrenamiento.codigoEntrenamiento, codigosExcluidos)
          : sql`true`
      )
    )
    .orderBy(sql`ST_Distance(${entrenamiento.puntoEncuentro}::geography, ${punto}) ASC`)
    .limit(20);

  if (rows.length === 0) return [];

  const codigos = rows.map((r) => r.codigoEntrenamiento);

  const participantes = await db
    .select({
      codigoEntrenamiento: usuarioEntrenamiento.codigoEntrenamiento,
      email: usuarioEntrenamiento.email,
      rol: usuarioEntrenamiento.rol,
      nombre: usuario.nombre,
      fotoPerfil: usuario.fotoPerfil,
    })
    .from(usuarioEntrenamiento)
    .innerJoin(usuario, eq(usuarioEntrenamiento.email, usuario.email))
    .where(
        sql`${usuarioEntrenamiento.codigoEntrenamiento} = ANY(ARRAY[${sql.join(codigos.map((c) => sql`${c}::integer`), sql`, `)}])`    
      );

  return rows.map((r) => {
    const miembros = participantes.filter(
      (p) => p.codigoEntrenamiento === r.codigoEntrenamiento
    );
    const organizador = miembros.find((p) => p.rol === "organizador") ?? miembros[0];

    return {
      ...r,
      distanciaKm: Math.round((r.distanciaMetros / 1000) * 10) / 10,
      organizadorNombre: organizador?.nombre ?? "Organizador",
      organizadorFoto: organizador?.fotoPerfil ?? null,
      cantParticipantes: miembros.length,
    };
  });
}

export async function getPerfilUsuario() {
  const session = await getServerSession(await headers());
  if (!session) throw new Error("No autenticado");

  const [perfil] = await db
    .select({
      nombre: usuario.nombre,
      codigoDeporte: usuario.codigoDeporte,
      ubicacion: usuario.ubicacion,
    })
    .from(usuario)
    .where(eq(usuario.email, session.user.email))
    .limit(1);

  return perfil ?? null;
}