import "server-only";

import { asc, and, eq, count, sql } from "drizzle-orm";
import { crearNotificacion } from "@/services/notificacionService";
import { db } from "@/lib/db";
import {
  solicitud,
  entrenamiento,
  usuarioEntrenamiento,
  usuario
} from "@/db/schema";

import {
  ValidationError,
  NotFoundError,
} from "@/lib/api-errors";

import { revalidatePath } from "next/cache";

export async function crearSolicitud(
  email: string,
  codigoEntrenamiento: number
) {
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
    throw new Error(
      "Ya existe una solicitud activa."
    );
  }

  const entrenamientoDB = await db
    .select()
    .from(entrenamiento)
    .where(
      eq(
        entrenamiento.codigoEntrenamiento,
        codigoEntrenamiento
      )
    );

  if (entrenamientoDB.length === 0) {
    throw new Error(
      "Entrenamiento inexistente."
    );
  }

  const ent = entrenamientoDB[0];

  if (ent.estado !== "abierto") {
    throw new Error(
      "El entrenamiento no acepta solicitudes."
    );
  }

  const ahora = new Date();

  const diferencia =
    ent.fechaInicio.getTime() -
    ahora.getTime();

  if (diferencia < 2 * 60 * 60 * 1000) {
    throw new Error(
      "El entrenamiento comienza en menos de 2 horas."
    );
  }

  const entrenamientoInfo = await db
  .select({
    emailOrganizador: usuarioEntrenamiento.email,
  })
  .from(usuarioEntrenamiento)
  .where(
    and(
      eq(
        usuarioEntrenamiento.codigoEntrenamiento,
        codigoEntrenamiento
      ),
      eq(usuarioEntrenamiento.rol, "organizador")
    )
  )
  .limit(1);

if (!entrenamientoInfo.length) {
  throw new Error("Entrenamiento no encontrado");
}

if (entrenamientoInfo[0].emailOrganizador === email) {
  throw new Error(
    "El organizador no puede solicitar participar en su propio entrenamiento."
  );
}

// Contar participantes aceptados
const participantes = await db
  .select()
  .from(usuarioEntrenamiento)
  .where(
    and(
      eq(
        usuarioEntrenamiento.codigoEntrenamiento,
        codigoEntrenamiento
      ),
      eq(usuarioEntrenamiento.rol, "participante")
    )
  );

  // Si el cupo está lleno, no permitir la solicitud
  if ( ent.cupoMaximo !== null && participantes.length >= ent.cupoMaximo) {
          throw new Error( "El entrenamiento ya no tiene cupos disponibles.");
  }

  const nueva = await db
    .insert(solicitud)
    .values({
      email,
      codigoEntrenamiento,
      estado: "pendiente",
      fecha: ahora,
    })
    .returning();

    try {
      const solicitante = await db
        .select({ nombre: usuario.nombre })
        .from(usuario)
        .where(eq(usuario.email, email))
        .limit(1);
      const nombreSolicitante = solicitante[0]?.nombre ?? email;
      await crearNotificacion(
        entrenamientoInfo[0].emailOrganizador,
        "nueva_solicitud",
        `${nombreSolicitante} quiere unirse a tu entrenamiento`,
        codigoEntrenamiento
      );
    } catch (e) { console.error("Error creando notificacion:", e); }

  return nueva[0];
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
        eq(
          usuarioEntrenamiento.rol,
          "organizador"
        )
      )
    );

  if (organizador.length === 0) {
    throw new Error(
      "Solo el organizador puede ver solicitudes."
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
          eq(
            solicitud.estado,
            estado as
              | "pendiente"
              | "aprobado"
              | "rechazado"
          )
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

    const solicitudDB = await tx
      .select()
      .from(solicitud)
      .where(
        eq(
          solicitud.codigoSolicitud,
          codigoSolicitud
        )
      );

    if (solicitudDB.length === 0) {
      throw new Error(
        "Solicitud inexistente."
      );
    }

    const sol = solicitudDB[0];

    const organizador = await tx
      .select()
      .from(usuarioEntrenamiento)
      .where(
        and(
          eq(
            usuarioEntrenamiento.codigoEntrenamiento,
            sol.codigoEntrenamiento
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
      throw new Error(
        "Solo el organizador puede aceptar."
      );
    }

    const entrenamientoDB = await tx
      .select()
      .from(entrenamiento)
      .where(
        eq(
          entrenamiento.codigoEntrenamiento,
          sol.codigoEntrenamiento
        )
      );

    const ent = entrenamientoDB[0];

    const horasRestantes =
        (new Date(ent.fechaInicio).getTime() - Date.now()) /
        (1000 * 60 * 60);
        
      if (horasRestantes <= 0) {
          throw new Error(
            "El entrenamiento ya comenzó."
          );
        }

      if (horasRestantes < 2) {
        throw new Error(
          "No se puede aceptar la solicitud porque el entrenamiento comienza en menos de 2 horas."
        );
      }

    const participantes = await tx
      .select({
        total: count(),
      })
      .from(usuarioEntrenamiento)
      .where(
        eq(
          usuarioEntrenamiento.codigoEntrenamiento,
          sol.codigoEntrenamiento
        )
      );

    const cantidad =
      Number(participantes[0].total);

    if (
      ent.cupoMaximo !== null &&
      cantidad >= ent.cupoMaximo
    ) {
      throw new Error(
        "El entrenamiento ya alcanzó su cupo."
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

      const yaParticipa = await tx
          .select()
          .from(usuarioEntrenamiento)
          .where(
            and(
              eq(usuarioEntrenamiento.codigoEntrenamiento, sol.codigoEntrenamiento),
              eq(usuarioEntrenamiento.email, sol.email)
            )
          )
          .limit(1);

        if (yaParticipa.length > 0) {
          // Ya está en el grupo, solo actualizar el estado de la solicitud
          await tx
            .update(solicitud)
            .set({ estado: "aprobado" })
            .where(eq(solicitud.codigoSolicitud, codigoSolicitud));
          return { ok: true };
        }

    await tx
      .insert(usuarioEntrenamiento)
      .values({
        codigoEntrenamiento:
          sol.codigoEntrenamiento,
        email: sol.email,
        rol: "participante",
      });

      try {
        await crearNotificacion(
          sol.email,
          "solicitud_aceptada",
          `Fuiste aceptado en el entrenamiento`,
          sol.codigoEntrenamiento
        );
      } catch (e) { console.error("Error creando notificacion:", e); }
      revalidatePath("/solicitudes");
    return {
      ok: true,
    };
  });
}

export async function rechazarSolicitud(
  emailOrganizador: string,
  codigoSolicitud: number
) {
  return db.transaction(async (tx) => {

    const solicitudDB = await tx
      .select()
      .from(solicitud)
      .where(
        eq(
          solicitud.codigoSolicitud,
          codigoSolicitud
        )
      );

    if (solicitudDB.length === 0) {
      throw new Error(
        "Solicitud inexistente."
      );
    }

    const sol = solicitudDB[0];

    const organizador = await tx
      .select()
      .from(usuarioEntrenamiento)
      .where(
        and(
          eq(
            usuarioEntrenamiento.codigoEntrenamiento,
            sol.codigoEntrenamiento
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
      throw new Error(
        "Solo el organizador puede rechazar."
      );
    }

    await tx
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


      try {
          await crearNotificacion(
            sol.email,
            "solicitud_rechazada",
            "Tu solicitud para participar en el entrenamiento fue rechazada.",
            sol.codigoEntrenamiento
          );
        } catch (e) {
          console.error("Error creando notificacion:", e);
        }

    return {
      ok: true,
    };
  });
}

export async function getSolicitudesPendientesDelOrganizador(
  emailOrganizador: string,
  pagina?: number,
  limite: number = 10
) {
  const selectFields = {
    codigoSolicitud: solicitud.codigoSolicitud,
    estado: solicitud.estado,
    fecha: solicitud.fecha,
    emailSolicitante: solicitud.email,
    nombreSolicitante: usuario.nombre,
    codigoEntrenamiento: entrenamiento.codigoEntrenamiento,
    deporte: entrenamiento.codigoDeporte,
    fechaInicio: entrenamiento.fechaInicio,
    nivel: entrenamiento.nivel,
    cupo: entrenamiento.cupoMaximo,
  };

  const [countRow] = await db
    .select({ total: count() })
    .from(usuarioEntrenamiento)
    .innerJoin(entrenamiento, eq(usuarioEntrenamiento.codigoEntrenamiento, entrenamiento.codigoEntrenamiento))
    .innerJoin(solicitud, eq(solicitud.codigoEntrenamiento, entrenamiento.codigoEntrenamiento))
    .innerJoin(usuario, eq(usuario.email, solicitud.email))
    .where(
      and(
        eq(usuarioEntrenamiento.email, emailOrganizador),
        eq(usuarioEntrenamiento.rol, "organizador"),
        eq(solicitud.estado, "pendiente"),
        eq(entrenamiento.estado, "abierto"),
        sql`${entrenamiento.fechaInicio} > NOW() + INTERVAL '2 hours'`
      )
    );

  const total = Number(countRow?.total ?? 0);
  const offset = pagina !== undefined ? (pagina - 1) * limite : undefined;

  let query = db
    .select(selectFields)
    .from(usuarioEntrenamiento)
    .innerJoin(entrenamiento, eq(usuarioEntrenamiento.codigoEntrenamiento, entrenamiento.codigoEntrenamiento))
    .innerJoin(solicitud, eq(solicitud.codigoEntrenamiento, entrenamiento.codigoEntrenamiento))
    .innerJoin(usuario, eq(usuario.email, solicitud.email))
    .where(
      and(
        eq(usuarioEntrenamiento.email, emailOrganizador),
        eq(usuarioEntrenamiento.rol, "organizador"),
        eq(solicitud.estado, "pendiente"),
        eq(entrenamiento.estado, "abierto"),
        sql`${entrenamiento.fechaInicio} > NOW() + INTERVAL '2 hours'`
      )
    )
    .orderBy(asc(entrenamiento.fechaInicio));

  const rows = pagina !== undefined
    ? await (query as any).limit(limite).offset(offset!)
    : await query;

  return {
    data: rows,
    total,
    pagina: pagina ?? 1,
    totalPaginas: Math.ceil(total / (pagina !== undefined ? limite : Math.max(total, 1))),
  };
}

export async function rechazarSolicitudesExpiradas() {
  const solicitudes = await db
    .select({
      codigoSolicitud: solicitud.codigoSolicitud,
      codigoEntrenamiento: solicitud.codigoEntrenamiento,
      email: solicitud.email,
    })
    .from(solicitud)
    .innerJoin(
      entrenamiento,
      eq(
        solicitud.codigoEntrenamiento,
        entrenamiento.codigoEntrenamiento
      )
    )
    .where(sql`
      ${solicitud.estado} = 'pendiente'
      AND ${entrenamiento.fechaInicio} <= NOW() + INTERVAL '2 hours'
    `);

  if (solicitudes.length === 0) {
    return 0;
  }

  await db.execute(sql`
    UPDATE "SOLICITUD"
    SET estado = 'rechazado'
    WHERE estado = 'pendiente'
      AND codigo_entrenamiento IN (
        SELECT codigo_entrenamiento
        FROM "ENTRENAMIENTO"
        WHERE fecha_inicio <= NOW() + INTERVAL '2 hours'
      )
  `);

  for (const s of solicitudes) {
      try {
        await crearNotificacion(
          s.email,
          "solicitud_rechazada",
          "Tu solicitud para participar en el entrenamiento fue rechazada porque el entrenamiento está próximo a comenzar.",
          s.codigoEntrenamiento
        );
      } catch (e) {
        console.error("Error creando notificación:", e);
      }
    }

  return solicitudes.length;
}