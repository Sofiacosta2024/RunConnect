import { DatabaseUnavailableError, NotFoundError, ValidationError } from "@/lib/api-errors";
import { db } from "@/lib/db";
import { entrenamiento, deporte, nivelEntrenamiento } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { sql } from "drizzle-orm";

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
  idOrganizador: number;
  codigoDeporte: string;
  descripcionDeporte: string | null;
  fecha: string;
  hora: string;
  ubicacion: string | null;
  distanciaEstimada: number | null;
  ritmoObjetivo: string | null;
  codigoNivel: string;
  descripcionNivel: string | null;
  cupoMaximo: number | null;
};

export type EntrenamientoInput = {
  codigoDeporte: string;
  fecha: string;
  hora: string;
  fechaInicio?: string;
  fechaFin?: string;
  fechaLimiteInscripcion?: string | null;
  ubicacion: LocationInput;
  distanciaEstimada?: number | null;
  ritmoObjetivo?: string | null;
  codigoNivel: string;
  cupoMaximo?: number | null;
};

type EntrenamientoRow = {
  codigoEntrenamiento: number;
  idOrganizador: number;
  codigoDeporte: string;
  descripcionDeporte: string | null;
  fecha: string;
  hora: string;
  ubicacion: string | null;
  distanciaEstimada: string | number | null;
  ritmoObjetivo: string | null;
  codigoNivel: string;
  descripcionNivel: string | null;
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
    idOrganizador: Number(row.idOrganizador),
    codigoDeporte: row.codigoDeporte,
    descripcionDeporte: row.descripcionDeporte,
    fecha: row.fecha,
    hora: row.hora,
    ubicacion: row.ubicacion,
    distanciaEstimada: toNumberOrNull(row.distanciaEstimada),
    ritmoObjetivo: row.ritmoObjetivo,
    codigoNivel: row.codigoNivel,
    descripcionNivel: row.descripcionNivel,
    cupoMaximo: toNumberOrNull(row.cupoMaximo),
  };
}

function isFinitePositiveInteger(value: unknown) {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

function isValidDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

function isValidTime(value: string) {
  return /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(value);
}

function normalizeIsoDateTime(value: string) {
  const trimmed = value.trim();
  const withT = trimmed.includes("T") ? trimmed : trimmed.replace(" ", "T");

  if (/^\d{4}-\d{2}-\d{2}$/.test(withT)) {
    return `${withT}T00:00:00Z`;
  }

  const hasTimezone = /[zZ]|[+-]\d{2}:\d{2}$/.test(withT);
  return hasTimezone ? withT : `${withT}Z`;
}

function parseUtcDateTime(value: string, fieldName: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new ValidationError(`${fieldName} es obligatoria.`);
  }

  const parsed = new Date(normalizeIsoDateTime(trimmed));

  if (Number.isNaN(parsed.getTime())) {
    throw new ValidationError(`${fieldName} debe tener formato ISO 8601 valido.`);
  }

  return parsed;
}

function resolveStartDate(input: EntrenamientoInput) {
  const hasFecha = Boolean(input.fecha?.trim());
  const hasHora = Boolean(input.hora?.trim());

  if (hasFecha || hasHora) {
    if (!hasFecha) {
      throw new ValidationError("fecha es obligatoria.");
    }

    if (!hasHora) {
      throw new ValidationError("hora es obligatoria.");
    }

    if (!isValidDate(input.fecha)) {
      throw new ValidationError("fecha debe tener formato YYYY-MM-DD y ser valida.");
    }

    if (!isValidTime(input.hora)) {
      throw new ValidationError("hora debe tener formato HH:MM o HH:MM:SS y ser valida.");
    }

    const start = parseUtcDateTime(`${input.fecha}T${input.hora}`, "fecha_inicio");
    return { start, fechaDb: input.fecha, horaDb: input.hora };
  }

  if (input.fechaInicio?.trim()) {
    const start = parseUtcDateTime(input.fechaInicio, "fecha_inicio");
    const iso = start.toISOString();
    return { start, fechaDb: iso.slice(0, 10), horaDb: iso.slice(11, 19) };
  }

  throw new ValidationError("fecha_inicio es obligatoria.");
}

function normalizeLocation(ubicacion: LocationInput) {
  if (typeof ubicacion === "string") {
    const trimmed = ubicacion.trim();

    if (!trimmed) {
      throw new ValidationError("ubicacion es obligatoria.");
    }

    return trimmed;
  }

  const latitude = ubicacion.latitude ?? ubicacion.lat;
  const longitude = ubicacion.longitude ?? ubicacion.lng;

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new ValidationError("ubicacion debe contener coordenadas validas.");
  }

  return `SRID=4326;POINT(${longitude} ${latitude})`;
}

function validateInput(input: EntrenamientoInput) {
  if (!input.codigoDeporte?.trim()) {
    throw new ValidationError("codigoDeporte es obligatorio.");
  }

  if (!input.codigoNivel?.trim()) {
    throw new ValidationError("codigoNivel es obligatorio.");
  }

  const { start, fechaDb, horaDb } = resolveStartDate(input);
  const now = new Date();

  if (start.getTime() <= now.getTime()) {
    throw new ValidationError("fecha_inicio debe ser posterior a la fecha y hora actual.");
  }

  const fechaFin = input.fechaFin?.trim() ?? "";
  const end = fechaFin ? parseUtcDateTime(fechaFin, "fecha_fin") : start;

  if (end.getTime() < start.getTime()) {
    throw new ValidationError("fecha_fin debe ser igual o posterior a fecha_inicio.");
  }

  const limiteRaw = input.fechaLimiteInscripcion;

  if (limiteRaw !== undefined && limiteRaw !== null && String(limiteRaw).trim()) {
    const limite = parseUtcDateTime(String(limiteRaw), "fecha_limite_inscripcion");

    if (limite.getTime() <= now.getTime()) {
      throw new ValidationError(
        "fecha_limite_inscripcion debe ser posterior a la fecha y hora actual."
      );
    }

    if (limite.getTime() > start.getTime()) {
      throw new ValidationError(
        "fecha_limite_inscripcion debe ser anterior o igual a fecha_inicio."
      );
    }
  }

  if (input.cupoMaximo !== undefined && input.cupoMaximo !== null) {
    if (!Number.isInteger(input.cupoMaximo) || input.cupoMaximo <= 0) {
      throw new ValidationError("cupoMaximo debe ser un entero positivo.");
    }
  }

  if (input.distanciaEstimada !== undefined && input.distanciaEstimada !== null) {
    if (
      typeof input.distanciaEstimada !== "number" ||
      !Number.isFinite(input.distanciaEstimada) ||
      input.distanciaEstimada <= 0
    ) {
      throw new ValidationError("distanciaEstimada debe ser un numero positivo.");
    }
  }

  return { fechaDb, horaDb };
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
        idOrganizador: entrenamiento.idOrganizador,
        codigoDeporte: entrenamiento.codigoDeporte,
        descripcionDeporte: deporte.descripcionDeporte,
        fecha: sql`${entrenamiento.fecha}::text`,
        hora: sql`${entrenamiento.hora}::text`,
        ubicacion: sql`ST_AsText(${entrenamiento.puntoEncuentro}::geometry)`,
        distanciaEstimada: entrenamiento.distanciaEstimada,
        ritmoObjetivo: entrenamiento.ritmoObjetivo,
        codigoNivel: entrenamiento.codigoNivel,
        descripcionNivel: nivelEntrenamiento.descripcionNivel,
        cupoMaximo: entrenamiento.cupoMaximo,
      })
      .from(entrenamiento)
      .innerJoin(deporte, eq(deporte.nombre, entrenamiento.codigoDeporte))
      .innerJoin(nivelEntrenamiento, eq(nivelEntrenamiento.nivel, entrenamiento.codigoNivel))
      .orderBy(desc(entrenamiento.fecha), desc(entrenamiento.hora), desc(entrenamiento.codigoEntrenamiento));

    return rows.map((r: unknown) => mapEntrenamiento(r as EntrenamientoRow));
  } catch (error) {
    throwDatabaseUnavailable(error, "getAll");
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
        idOrganizador: entrenamiento.idOrganizador,
        codigoDeporte: entrenamiento.codigoDeporte,
        descripcionDeporte: deporte.descripcionDeporte,
        fecha: sql`${entrenamiento.fecha}::text`,
        hora: sql`${entrenamiento.hora}::text`,
        ubicacion: sql`ST_AsText(${entrenamiento.puntoEncuentro}::geometry)`,
        distanciaEstimada: entrenamiento.distanciaEstimada,
        ritmoObjetivo: entrenamiento.ritmoObjetivo,
        codigoNivel: entrenamiento.codigoNivel,
        descripcionNivel: nivelEntrenamiento.descripcionNivel,
        cupoMaximo: entrenamiento.cupoMaximo,
      })
      .from(entrenamiento)
      .innerJoin(deporte, eq(deporte.nombre, entrenamiento.codigoDeporte))
      .innerJoin(nivelEntrenamiento, eq(nivelEntrenamiento.nivel, entrenamiento.codigoNivel))
      .where(eq(entrenamiento.codigoEntrenamiento, codigoEntrenamiento))
      .limit(1);

    const row = rows[0];

    return row ? mapEntrenamiento(row as EntrenamientoRow) : null;
  } catch (error) {
    throwDatabaseUnavailable(error, "getById");
  }
}

export async function create(idOrganizador: number, input: EntrenamientoInput) {
  if (!isFinitePositiveInteger(idOrganizador)) {
    throw new ValidationError("idOrganizador debe ser un entero positivo.");
  }

  const { fechaDb, horaDb } = validateInput(input);

  const ubicacion = normalizeLocation(input.ubicacion);

  try {
    const insertResult = await db.execute(sql`
      INSERT INTO "ENTRENAMIENTO" (
        id_organizador,
        codigo_deporte,
        fecha,
        hora,
        punto_de_encuentro,
        distancia_estimada,
        ritmo_objetivo,
        codigo_nivel,
        cupo_maximo
      ) VALUES (
        ${idOrganizador},
        ${input.codigoDeporte.trim()},
        ${fechaDb}::date,
        ${horaDb}::time,
        ST_GeogFromText(${ubicacion}),
        ${input.distanciaEstimada ?? null},
        ${input.ritmoObjetivo?.trim() ?? null},
        ${input.codigoNivel.trim()},
        ${input.cupoMaximo ?? null}
      ) RETURNING codigo_entrenamiento
    `);

    const insertedId = insertResult.rows?.[0]?.codigo_entrenamiento;
    if (!insertedId) throw new DatabaseUnavailableError();
    return getById(Number(insertedId));
  } catch (error) {
    throwDatabaseUnavailable(error, "create");
  }
}

export async function update(codigoEntrenamiento: number, input: EntrenamientoInput) {
  if (!isFinitePositiveInteger(codigoEntrenamiento)) {
    throw new ValidationError("codigoEntrenamiento debe ser un entero positivo.");
  }

  const { fechaDb, horaDb } = validateInput(input);

  const ubicacion = normalizeLocation(input.ubicacion);

  try {
    const updateResult = await db.execute(sql`
      UPDATE "ENTRENAMIENTO" SET
        codigo_deporte = ${input.codigoDeporte.trim()},
        fecha = ${fechaDb}::date,
        hora = ${horaDb}::time,
        punto_de_encuentro = ST_GeogFromText(${ubicacion}),
        distancia_estimada = ${input.distanciaEstimada ?? null},
        ritmo_objetivo = ${input.ritmoObjetivo?.trim() ?? null},
        codigo_nivel = ${input.codigoNivel.trim()},
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
