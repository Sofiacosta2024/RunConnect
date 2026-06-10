import {
  DatabaseUnavailableError,
  EntrenamientoValidationError,
  NotFoundError,
  ValidationError,
} from "@/lib/api-errors";
import { db } from "@/lib/db";
import { entrenamiento, deporte, usuarioEntrenamiento, solicitud } from "@/db/schema";
import { validarFechasEntrenamiento } from "@/lib/entrenamiento-fechas";
import { and, asc, desc, eq } from "drizzle-orm";
import { sql } from "drizzle-orm";

export interface GetFilteredParams {
  codigoDeporte?: string;
  nivel?: string;
  fecha?: string;
  lat?: number;
  lng?: number;
  radioKm?: number;
}

type LocationInput =
  | string
  | {
      latitude?: number;
      longitude?: number;
      lat?: number;
      lng?: number;
    };

export type EntrenamientoListItem = {
  codigoEntrenamiento: number;
  emailOrganizador: string;
  codigoDeporte: string;
  descripcionDeporte: string | null;
  fechaInicio: string;
  fechaFin: string;
  estado: string;
  puntoEncuentro: string | null;
  distanciaEstimada: number | null;
  ritmoObjetivo: string | null;
  nivel: string;
  cupoMaximo: number | null;
};

export type EntrenamientoInput = {
  codigoDeporte: string;
  fechaInicio: string;
  fechaFin: string;
  estado: string;
  puntoEncuentro: LocationInput;
  distanciaEstimada?: number | null;
  ritmoObjetivo?: string | null;
  nivel: string;
  cupoMaximo?: number | null;
};

type EntrenamientoChatInput = Omit<EntrenamientoInput, "estado">;

type EntrenamientoRow = {
  codigoEntrenamiento: number;
  emailOrganizador: string;
  codigoDeporte: string;
  descripcionDeporte: string | null;
  fechaInicio: string;
  fechaFin: string;
  estado: string;
  puntoEncuentro: string | null;
  distanciaEstimada: string | number | null;
  ritmoObjetivo: string | null;
  nivel: string;
  cupoMaximo: number | string | null;
};

function toNumberOrNull(value: string | number | null) {
  if (value === null) return null;

  const parsed = typeof value === "number" ? value : Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

function mapEntrenamiento(row: EntrenamientoRow): EntrenamientoListItem {
  return {
    codigoEntrenamiento: Number(row.codigoEntrenamiento),
    emailOrganizador: row.emailOrganizador,
    codigoDeporte: row.codigoDeporte,
    descripcionDeporte: row.descripcionDeporte,
    fechaInicio: row.fechaInicio,
    fechaFin: row.fechaFin,
    estado: row.estado,
    puntoEncuentro: row.puntoEncuentro,
    distanciaEstimada: toNumberOrNull(row.distanciaEstimada),
    ritmoObjetivo: row.ritmoObjetivo,
    nivel: row.nivel,
    cupoMaximo: toNumberOrNull(row.cupoMaximo),
  };
}

function isFinitePositiveInteger(value: unknown) {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

const entrenamientoEstados = new Set([
  "abierto",
  "cerrado",
  "cancelado",
  "finalizado",
]);

const entrenamientoNiveles = new Set(["principiante", "intermedio", "avanzado"]);
const rolOrganizador = "organizador";

function resolveEstado(estado: string) {
  const normalized = estado.trim().toLowerCase();

  if (!normalized) {
    throw new EntrenamientoValidationError("estado es obligatorio.");
  }

  if (!entrenamientoEstados.has(normalized)) {
    throw new EntrenamientoValidationError(
      "estado debe ser uno de: abierto, cerrado, cancelado, finalizado."
    );
  }

  return normalized;
}

function resolveNivel(nivel: string) {
  const normalized = nivel.trim().toLowerCase();

  if (!normalized) {
    throw new EntrenamientoValidationError("nivel es obligatorio.");
  }

  if (!entrenamientoNiveles.has(normalized)) {
    throw new EntrenamientoValidationError(
      "nivel debe ser uno de: principiante, intermedio, avanzado."
    );
  }

  return normalized;
}

function normalizePuntoEncuentro(puntoEncuentro: LocationInput) {
  if (typeof puntoEncuentro === "string") {
    const trimmed = puntoEncuentro.trim();

    if (!trimmed) {
      throw new EntrenamientoValidationError("ubicacion es obligatoria.");
    }

    return trimmed;
  }

  const latitude = puntoEncuentro.latitude ?? puntoEncuentro.lat;
  const longitude = puntoEncuentro.longitude ?? puntoEncuentro.lng;

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new EntrenamientoValidationError("ubicacion debe contener coordenadas validas.");
  }

  return `SRID=4326;POINT(${longitude} ${latitude})`;
}

function validateInput(input: EntrenamientoInput) {
  if (!input.codigoDeporte?.trim()) {
    throw new EntrenamientoValidationError("codigoDeporte es obligatorio.");
  }

  const nivel = resolveNivel(input.nivel);

  const fechaInicioRaw = input.fechaInicio?.trim();
  const fechaFinRaw = input.fechaFin?.trim();

  if (!fechaInicioRaw) {
    throw new EntrenamientoValidationError("fecha_inicio es obligatoria.");
  }

  if (!fechaFinRaw) {
    throw new EntrenamientoValidationError("fecha_fin es obligatoria.");
  }

  const fechasValidation = validarFechasEntrenamiento({
    fechaInicio: fechaInicioRaw,
    fechaFin: fechaFinRaw,
    now: new Date(),
  });

  if (!fechasValidation.valido || !fechasValidation.fechas) {
    throw new EntrenamientoValidationError(
      fechasValidation.error ?? "Fechas invalidas."
    );
  }

  const { inicio, fin } = fechasValidation.fechas;

  const estado = resolveEstado(input.estado);

  if (input.cupoMaximo !== undefined && input.cupoMaximo !== null) {
    if (!Number.isInteger(input.cupoMaximo) || input.cupoMaximo <= 0) {
      throw new EntrenamientoValidationError("cupoMaximo debe ser un entero positivo.");
    }
  }

  if (input.distanciaEstimada !== undefined && input.distanciaEstimada !== null) {
    if (
      typeof input.distanciaEstimada !== "number" ||
      !Number.isFinite(input.distanciaEstimada) ||
      input.distanciaEstimada <= 0
    ) {
      throw new EntrenamientoValidationError(
        "distanciaEstimada debe ser un numero positivo."
      );
    }
  }

  return {
    fechaInicioDb: inicio.toISOString(),
    fechaFinDb: fin.toISOString(),
    estado,
    nivel,
  };
}

function isDatabaseError(error: unknown) {
  return error instanceof Error && typeof (error as { code?: string }).code === "string";
}

function throwDatabaseUnavailable(error: unknown, operation: string): never {
  const pgDetails = {
    code: (error as { code?: string }).code || "UNKNOWN",
    message: error instanceof Error ? error.message : String(error),
  };

  if (isDatabaseError(error)) {
    console.error(`[entrenamientoService:${operation}]`, pgDetails);
  } else {
    console.error(`[entrenamientoService:${operation}]`, error);
  }

  throw new DatabaseUnavailableError(
    "El proveedor externo de base de datos no responde.",
    pgDetails
  );
}

export async function getAll() {
  try {
    const rows = await db
      .select({
        codigoEntrenamiento: entrenamiento.codigoEntrenamiento,
        emailOrganizador: usuarioEntrenamiento.email,
        codigoDeporte: entrenamiento.codigoDeporte,
        descripcionDeporte: deporte.descripcionDeporte,
        fechaInicio: sql`${entrenamiento.fechaInicio}::text`,
        fechaFin: sql`${entrenamiento.fechaFin}::text`,
        estado: entrenamiento.estado,
        puntoEncuentro: sql`ST_AsText(${entrenamiento.puntoEncuentro}::geometry)`,
        distanciaEstimada: entrenamiento.distanciaEstimada,
        ritmoObjetivo: entrenamiento.ritmoObjetivo,
        nivel: entrenamiento.nivel,
        cupoMaximo: entrenamiento.cupoMaximo,
      })
      .from(entrenamiento)
      .innerJoin(deporte, eq(deporte.nombre, entrenamiento.codigoDeporte))
      .innerJoin(
        usuarioEntrenamiento,
        and(
          eq(usuarioEntrenamiento.codigoEntrenamiento, entrenamiento.codigoEntrenamiento),
          eq(usuarioEntrenamiento.rol, rolOrganizador)
        )
      )
      .orderBy(desc(entrenamiento.fechaInicio), desc(entrenamiento.codigoEntrenamiento));

    return rows.map((r: unknown) => mapEntrenamiento(r as EntrenamientoRow));
  } catch (error) {
    throwDatabaseUnavailable(error, "getAll");
  }
}

export async function getFiltered(params: GetFilteredParams = {}) {
  try {
    const conditions: ReturnType<typeof sql>[] = [
      sql`${entrenamiento.fechaInicio} > NOW()`,
    ];

    if (params.codigoDeporte) {
      conditions.push(sql`${entrenamiento.codigoDeporte} = ${params.codigoDeporte}`);
    }

    if (params.nivel) {
      conditions.push(sql`${entrenamiento.nivel} = ${params.nivel}`);
    }

    if (params.fecha) {
      conditions.push(sql`${entrenamiento.fechaInicio} >= ${params.fecha}::timestamptz`);
    }

    if (params.lat !== undefined && params.lng !== undefined) {
      const radioMeters = (params.radioKm ?? 10) * 1000;
      const point = `SRID=4326;POINT(${params.lng} ${params.lat})`;
      conditions.push(
        sql`ST_DWithin(${entrenamiento.puntoEncuentro}, ST_GeogFromText(${point}), ${radioMeters})`
      );
    }

    const rows = await db
      .select({
        codigoEntrenamiento: entrenamiento.codigoEntrenamiento,
        emailOrganizador: usuarioEntrenamiento.email,
        codigoDeporte: entrenamiento.codigoDeporte,
        descripcionDeporte: deporte.descripcionDeporte,
        fechaInicio: sql`${entrenamiento.fechaInicio}::text`,
        fechaFin: sql`${entrenamiento.fechaFin}::text`,
        estado: entrenamiento.estado,
        puntoEncuentro: sql`ST_AsText(${entrenamiento.puntoEncuentro}::geometry)`,
        distanciaEstimada: entrenamiento.distanciaEstimada,
        ritmoObjetivo: entrenamiento.ritmoObjetivo,
        nivel: entrenamiento.nivel,
        cupoMaximo: entrenamiento.cupoMaximo,
      })
      .from(entrenamiento)
      .innerJoin(deporte, eq(deporte.nombre, entrenamiento.codigoDeporte))
      .innerJoin(
        usuarioEntrenamiento,
        and(
          eq(usuarioEntrenamiento.codigoEntrenamiento, entrenamiento.codigoEntrenamiento),
          eq(usuarioEntrenamiento.rol, rolOrganizador)
        )
      )
      .where(and(...conditions))
      .orderBy(asc(entrenamiento.fechaInicio));

    return rows.map((r: unknown) => mapEntrenamiento(r as EntrenamientoRow));
  } catch (error) {
    throwDatabaseUnavailable(error, "getFiltered");
  }
}

export async function getById(codigoEntrenamiento: number) {
  if (!isFinitePositiveInteger(codigoEntrenamiento)) {
    throw new ValidationError("codigoEntrenamiento debe ser un entero positivo.");
  }

  try {
    const rows = await db
      .select({
        codigoEntrenamiento: entrenamiento.codigoEntrenamiento,
        emailOrganizador: usuarioEntrenamiento.email,
        codigoDeporte: entrenamiento.codigoDeporte,
        descripcionDeporte: deporte.descripcionDeporte,
        fechaInicio: sql`${entrenamiento.fechaInicio}::text`,
        fechaFin: sql`${entrenamiento.fechaFin}::text`,
        estado: entrenamiento.estado,
        puntoEncuentro: sql`ST_AsText(${entrenamiento.puntoEncuentro}::geometry)`,
        distanciaEstimada: entrenamiento.distanciaEstimada,
        ritmoObjetivo: entrenamiento.ritmoObjetivo,
        nivel: entrenamiento.nivel,
        cupoMaximo: entrenamiento.cupoMaximo,
      })
      .from(entrenamiento)
      .innerJoin(deporte, eq(deporte.nombre, entrenamiento.codigoDeporte))
      .innerJoin(
        usuarioEntrenamiento,
        and(
          eq(usuarioEntrenamiento.codigoEntrenamiento, entrenamiento.codigoEntrenamiento),
          eq(usuarioEntrenamiento.rol, rolOrganizador)
        )
      )
      .where(eq(entrenamiento.codigoEntrenamiento, codigoEntrenamiento))
      .limit(1);

    const row = rows[0];

    return row ? mapEntrenamiento(row as EntrenamientoRow) : null;
  } catch (error) {
    throwDatabaseUnavailable(error, "getById");
  }
}

export async function create(emailOrganizador: string, input: EntrenamientoInput) {
  const organizerEmail = emailOrganizador?.trim();

  if (!organizerEmail) {
    throw new ValidationError("emailOrganizador es obligatorio.");
  }

  const { fechaInicioDb, fechaFinDb, estado, nivel } = validateInput(input);

  const puntoEncuentro = normalizePuntoEncuentro(input.puntoEncuentro);

  try {
    const insertedId = await db.transaction(async (tx) => {
      const userResult = await tx.execute(sql`
        SELECT email
        FROM "USUARIO"
        WHERE email = ${organizerEmail}
        LIMIT 1
      `);

      if (!userResult.rows?.[0]?.email) {
        throw new NotFoundError("Usuario no encontrado.");
      }

      const insertResult = await tx.execute(sql`
        INSERT INTO "ENTRENAMIENTO" (
          codigo_deporte,
          fecha_inicio,
          fecha_fin,
          estado,
          punto_de_encuentro,
          distancia_estimada,
          ritmo_objetivo,
          nivel,
          cupo_maximo
        ) VALUES (
          ${input.codigoDeporte.trim()},
          ${fechaInicioDb}::timestamptz,
          ${fechaFinDb}::timestamptz,
          ${estado},
          ST_GeogFromText(${puntoEncuentro}),
          ${input.distanciaEstimada ?? null},
          ${input.ritmoObjetivo?.trim() ?? null},
          ${nivel},
          ${input.cupoMaximo ?? null}
        ) RETURNING codigo_entrenamiento
      `);

      const codigoEntrenamiento = insertResult.rows?.[0]?.codigo_entrenamiento;
      if (!codigoEntrenamiento) throw new DatabaseUnavailableError();

      await tx.execute(sql`
        INSERT INTO "USUARIO_ENTRENAMIENTO" (
          codigo_entrenamiento,
          email,
          rol
        ) VALUES (
          ${codigoEntrenamiento},
          ${organizerEmail},
          ${rolOrganizador}
        )
      `);

      return Number(codigoEntrenamiento);
    });

    return getById(insertedId);
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    throwDatabaseUnavailable(error, "create");
  }
}

export async function crearEntrenamientoConChat(
  emailOrganizador: string,
  input: EntrenamientoChatInput
) {
  const organizerEmail = emailOrganizador?.trim();

  if (!organizerEmail) {
    throw new ValidationError("emailOrganizador es obligatorio.");
  }

  const { fechaInicioDb, fechaFinDb, nivel } = validateInput({
    ...input,
    estado: "abierto",
  });

  const puntoEncuentro = normalizePuntoEncuentro(input.puntoEncuentro);
  const welcomeMessage = "Entrenamiento creado. El chat esta disponible.";

  try {
    const insertedId = await db.transaction(async (tx) => {
      // Usamos transaccion para asegurar que entrenamiento, usuario_entrenamiento y mensaje
      // se creen juntos o se reviertan en caso de error.
      const userResult = await tx.execute(sql`
        SELECT email
        FROM "USUARIO"
        WHERE email = ${organizerEmail}
        LIMIT 1
      `);

      if (!userResult.rows?.[0]?.email) {
        throw new NotFoundError("Usuario no encontrado.");
      }

      const insertResult = await tx.execute(sql`
        INSERT INTO "ENTRENAMIENTO" (
          codigo_deporte,
          fecha_inicio,
          fecha_fin,
          estado,
          punto_de_encuentro,
          distancia_estimada,
          ritmo_objetivo,
          nivel,
          cupo_maximo
        ) VALUES (
          ${input.codigoDeporte.trim()},
          ${fechaInicioDb}::timestamptz,
          ${fechaFinDb}::timestamptz,
          ${"abierto"},
          ST_GeogFromText(${puntoEncuentro}),
          ${input.distanciaEstimada ?? null},
          ${input.ritmoObjetivo?.trim() ?? null},
          ${nivel},
          ${input.cupoMaximo ?? null}
        ) RETURNING codigo_entrenamiento
      `);

      const codigoEntrenamiento = insertResult.rows?.[0]?.codigo_entrenamiento;
      if (!codigoEntrenamiento) throw new DatabaseUnavailableError();

      const now = new Date();
      const fechaMensaje = now.toISOString().slice(0, 10);
      const horaMensaje = now.toISOString().slice(11, 19);

      await tx.execute(sql`
        INSERT INTO "USUARIO_ENTRENAMIENTO" (
          codigo_entrenamiento,
          email,
          rol
        ) VALUES (
          ${codigoEntrenamiento},
          ${organizerEmail},
          ${rolOrganizador}
        )
      `);

      await tx.execute(sql`
        INSERT INTO "MENSAJE" (
          codigo_entrenamiento,
          email,
          contenido
        ) VALUES (
          ${codigoEntrenamiento},
          ${organizerEmail},
          ${welcomeMessage}
        )
      `);

      return Number(codigoEntrenamiento);
    });

    return getById(insertedId);
  } catch (error) {
    if (
      error instanceof ValidationError ||
      error instanceof EntrenamientoValidationError ||
      error instanceof NotFoundError ||
      error instanceof DatabaseUnavailableError
    ) {
      throw error;
    }

    throwDatabaseUnavailable(error, "crearEntrenamientoConChat");
  }
}

export async function update(codigoEntrenamiento: number, input: EntrenamientoInput) {
  if (!isFinitePositiveInteger(codigoEntrenamiento)) {
    throw new ValidationError("codigoEntrenamiento debe ser un entero positivo.");
  }

  const { fechaInicioDb, fechaFinDb, estado, nivel } = validateInput(input);

  const puntoEncuentro = normalizePuntoEncuentro(input.puntoEncuentro);

  try {
    const updateResult = await db.execute(sql`
      UPDATE "ENTRENAMIENTO" SET
        codigo_deporte = ${input.codigoDeporte.trim()},
        fecha_inicio = ${fechaInicioDb}::timestamptz,
        fecha_fin = ${fechaFinDb}::timestamptz,
        estado = ${estado},
        punto_de_encuentro = ST_GeogFromText(${puntoEncuentro}),
        distancia_estimada = ${input.distanciaEstimada ?? null},
        ritmo_objetivo = ${input.ritmoObjetivo?.trim() ?? null},
        nivel = ${nivel},
        cupo_maximo = ${input.cupoMaximo ?? null}
      WHERE codigo_entrenamiento = ${codigoEntrenamiento}
      RETURNING codigo_entrenamiento
    `);

    const updatedId = updateResult.rows?.[0]?.codigo_entrenamiento;
    if (!updatedId) throw new NotFoundError("Entrenamiento no encontrado.");
    return getById(Number(updatedId));
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    throwDatabaseUnavailable(error, "update");
  }
}

export async function remove(codigoEntrenamiento: number) {
  if (!isFinitePositiveInteger(codigoEntrenamiento)) {
    throw new ValidationError("codigoEntrenamiento debe ser un entero positivo.");
  }
  try {
    const delResult = await db.execute(
      sql`DELETE FROM "ENTRENAMIENTO" WHERE codigo_entrenamiento = ${codigoEntrenamiento} RETURNING codigo_entrenamiento`
    );
    if (!delResult.rows || delResult.rows.length === 0) {
      throw new NotFoundError("Entrenamiento no encontrado.");
    }
    return { deleted: true, codigoEntrenamiento };
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    throwDatabaseUnavailable(error, "remove");
  }
}

export async function getMisEntrenamientos(
  email: string
): Promise<EntrenamientoListItem[]> {
  try {
    const rows = await db
      .select({
        codigoEntrenamiento: entrenamiento.codigoEntrenamiento,
        emailOrganizador: usuarioEntrenamiento.email,
        codigoDeporte: entrenamiento.codigoDeporte,
        descripcionDeporte: deporte.descripcionDeporte,
        fechaInicio: sql`${entrenamiento.fechaInicio}::text`,
        fechaFin: sql`${entrenamiento.fechaFin}::text`,
        estado: entrenamiento.estado,
        puntoEncuentro: sql`ST_AsText(${entrenamiento.puntoEncuentro}::geometry)`,
        distanciaEstimada: entrenamiento.distanciaEstimada,
        ritmoObjetivo: entrenamiento.ritmoObjetivo,
        nivel: entrenamiento.nivel,
        cupoMaximo: entrenamiento.cupoMaximo,
      })
      .from(solicitud)
      .innerJoin(
        entrenamiento,
        eq(
          solicitud.codigoEntrenamiento,
          entrenamiento.codigoEntrenamiento
        )
      )
      .innerJoin(
        deporte,
        eq(deporte.nombre, entrenamiento.codigoDeporte)
      )
      .innerJoin(
        usuarioEntrenamiento,
        and(
          eq(
            usuarioEntrenamiento.codigoEntrenamiento,
            entrenamiento.codigoEntrenamiento
          ),
          eq(usuarioEntrenamiento.rol, rolOrganizador)
        )
      )
      .where(
        and(
          eq(solicitud.email, email),
          eq(solicitud.estado, "aprobado")
        )
      )
      .orderBy(asc(entrenamiento.fechaInicio));

    return rows.map((r) => mapEntrenamiento(r as EntrenamientoRow));
  } catch (error) {
    throwDatabaseUnavailable(error, "getMisEntrenamientos");
  }
}
