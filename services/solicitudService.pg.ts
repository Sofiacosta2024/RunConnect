import "server-only";

import { and, eq, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  solicitud,
  entrenamiento,
  usuarioEntrenamiento,
} from "@/db/schema";

import {
  ValidationError,
  NotFoundError,
} from "@/lib/api-errors";

export async function crearSolicitud(
  email: string,
  codigoEntrenamiento: number
) {
  // verificar entrenamiento

  const training = await db
    .select()
    .from(entrenamiento)
    .where(
      eq(
        entrenamiento.codigoEntrenamiento,
        codigoEntrenamiento
      )
    );

  if (training.length === 0) {
    throw new NotFoundError(
      "Entrenamiento no encontrado"
    );
  }

  const e = training[0];

  if (e.estado !== "abierto") {
    throw new ValidationError(
      "El entrenamiento no acepta solicitudes."
    );
  }

  if (new Date(e.fechaInicio) <= new Date()) {
    throw new ValidationError(
      "El entrenamiento ya comenzó."
    );
  }

  // verificar solicitud existente

  const existente = await db
    .select()
    .from(solicitud)
    .where(
      and(
        eq(solicitud.email, email),
        eq(
          solicitud.codigoEntrenamiento,
          codigoEntrenamiento
        ),
        eq(solicitud.estado, "pendiente")
      )
    );

  if (existente.length > 0) {
    throw new ValidationError(
      "Ya existe una solicitud activa."
    );
  }

  const result = await db
    .insert(solicitud)
    .values({
      email,
      codigoEntrenamiento,
      estado: "pendiente",
      fecha: new Date(),
    })
    .returning();

  return result[0];
}

export async function obtenerSolicitudes(
  emailOrganizador: string,
  codigoEntrenamiento: number,
  estado?: string
) {
  const organizador = await db
    .select()
    .from(usuarioEntrenamiento)
    .where(
      and(
        eq(
          usuarioEntrenamiento.codigoEntrenamiento,
          codigoEntrenamiento
        ),
        eq(
          usuarioEntrenamiento.email,
          emailOrganizador
        ),
        eq(usuarioEntrenamiento.rol, "organizador")
      )
    );

  if (organizador.length === 0) {
    throw new ValidationError(
      "Solo el organizador puede ver las solicitudes."
    );
  }

  if (estado) {
    return db
      .select()
      .from(solicitud)
      .where(
        and(
          eq(
            solicitud.codigoEntrenamiento,
            codigoEntrenamiento
          ),
          eq(solicitud.estado, estado as any)
        )
      );
  }

  return db
    .select()
    .from(solicitud)
    .where(
      eq(
        solicitud.codigoEntrenamiento,
        codigoEntrenamiento
      )
    );
}

export async function aceptarSolicitud(
  emailOrganizador: string,
  codigoSolicitud: number
) {
  return db.transaction(async (tx) => {
    const rows = await tx
      .select()
      .from(solicitud)
      .where(
        eq(
          solicitud.codigoSolicitud,
          codigoSolicitud
        )
      );

    if (rows.length === 0) {
      throw new NotFoundError(
        "Solicitud inexistente"
      );
    }

    const s = rows[0];

    const organizador = await tx
      .select()
      .from(usuarioEntrenamiento)
      .where(
        and(
          eq(
            usuarioEntrenamiento.codigoEntrenamiento,
            s.codigoEntrenamiento
          ),
          eq(
            usuarioEntrenamiento.email,
            emailOrganizador
          ),
          eq(
            usuarioEntrenamiento.rol,
            "organizador"
          )
        )
      );

    if (organizador.length === 0) {
      throw new ValidationError(
        "No autorizado."
      );
    }

    await tx
      .update(solicitud)
      .set({
        estado: "aprobado",
      })
      .where(
        eq(
          solicitud.codigoSolicitud,
          codigoSolicitud
        )
      );

    await tx
      .insert(usuarioEntrenamiento)
      .values({
        codigoEntrenamiento:
          s.codigoEntrenamiento,
        email: s.email,
        rol: "participante",
      });

    return {
      ok: true,
    };
  });
}
export async function rechazarSolicitud(
  emailOrganizador: string,
  codigoSolicitud: number
) {
  const rows = await db
    .select()
    .from(solicitud)
    .where(
      eq(
        solicitud.codigoSolicitud,
        codigoSolicitud
      )
    );

  if (rows.length === 0) {
    throw new NotFoundError(
      "Solicitud inexistente"
    );
  }

  const s = rows[0];

  const organizador = await db
    .select()
    .from(usuarioEntrenamiento)
    .where(
      and(
        eq(
          usuarioEntrenamiento.codigoEntrenamiento,
          s.codigoEntrenamiento
        ),
        eq(
          usuarioEntrenamiento.email,
          emailOrganizador
        ),
        eq(
          usuarioEntrenamiento.rol,
          "organizador"
        )
      )
    );

  if (organizador.length === 0) {
    throw new ValidationError(
      "No autorizado."
    );
  }

  await db
    .update(solicitud)
    .set({
      estado: "rechazado",
    })
    .where(
      eq(
        solicitud.codigoSolicitud,
        codigoSolicitud
      )
    );

  return {
    ok: true,
  };
}