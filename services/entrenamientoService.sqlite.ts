import "server-only";

import { DatabaseUnavailableError, NotFoundError, ValidationError } from "@/lib/api-errors";
import { getSqliteDb } from "@/lib/sqlite";

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
  distanciaEstimada: number | null;
  ritmoObjetivo: string | null;
  codigoNivel: string;
  descripcionNivel: string | null;
  cupoMaximo: number | null;
};

const db = getSqliteDb();

function toNumberOrNull(value: number | null) {
  if (value === null) return null;

  return Number.isFinite(value) ? value : null;
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

    if (trimmed.startsWith("SRID=")) {
      const parts = trimmed.split(";");
      return parts.slice(1).join(";") || trimmed;
    }

    return trimmed;
  }

  const latitude = ubicacion.latitude ?? ubicacion.lat;
  const longitude = ubicacion.longitude ?? ubicacion.lng;

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new ValidationError("ubicacion debe contener coordenadas validas.");
  }

  return `POINT(${longitude} ${latitude})`;
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

  if (!fechaFin) {
    throw new ValidationError("fecha_fin es obligatoria.");
  }

  const end = parseUtcDateTime(fechaFin, "fecha_fin");

  if (end.getTime() <= start.getTime()) {
    throw new ValidationError("fecha_fin debe ser posterior a fecha_inicio.");
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

function throwDatabaseUnavailable(error: unknown, operation: string): never {
  console.error(`[entrenamientoService:sqlite:${operation}]`, error);
  throw new DatabaseUnavailableError("No se pudo acceder a la base de datos local.");
}

export async function getAll() {
  try {
    const rows = db
      .prepare(
        `
        SELECT
          e.codigo_entrenamiento AS codigoEntrenamiento,
          e.id_organizador AS idOrganizador,
          e.codigo_deporte AS codigoDeporte,
          d.descripcion_deporte AS descripcionDeporte,
          e.fecha AS fecha,
          e.hora AS hora,
          e.punto_de_encuentro AS ubicacion,
          e.distancia_estimada AS distanciaEstimada,
          e.ritmo_objetivo AS ritmoObjetivo,
          e.codigo_nivel AS codigoNivel,
          n.descripcion_nivel AS descripcionNivel,
          e.cupo_maximo AS cupoMaximo
        FROM "ENTRENAMIENTO" e
        INNER JOIN "DEPORTE" d ON d.nombre = e.codigo_deporte
        INNER JOIN "NIVEL_ENTRENAMIENTO" n ON n.nivel = e.codigo_nivel
        ORDER BY e.fecha DESC, e.hora DESC, e.codigo_entrenamiento DESC
      `
      )
      .all();

    return rows.map((row: EntrenamientoRow) => mapEntrenamiento(row));
  } catch (error) {
    throwDatabaseUnavailable(error, "getAll");
  }
}

export async function getById(codigoEntrenamiento: number) {
  if (!isFinitePositiveInteger(codigoEntrenamiento)) {
    throw new ValidationError("codigoEntrenamiento debe ser un entero positivo.");
  }

  try {
    const row = db
      .prepare(
        `
        SELECT
          e.codigo_entrenamiento AS codigoEntrenamiento,
          e.id_organizador AS idOrganizador,
          e.codigo_deporte AS codigoDeporte,
          d.descripcion_deporte AS descripcionDeporte,
          e.fecha AS fecha,
          e.hora AS hora,
          e.punto_de_encuentro AS ubicacion,
          e.distancia_estimada AS distanciaEstimada,
          e.ritmo_objetivo AS ritmoObjetivo,
          e.codigo_nivel AS codigoNivel,
          n.descripcion_nivel AS descripcionNivel,
          e.cupo_maximo AS cupoMaximo
        FROM "ENTRENAMIENTO" e
        INNER JOIN "DEPORTE" d ON d.nombre = e.codigo_deporte
        INNER JOIN "NIVEL_ENTRENAMIENTO" n ON n.nivel = e.codigo_nivel
        WHERE e.codigo_entrenamiento = ?
        LIMIT 1
      `
      )
      .get(codigoEntrenamiento) as EntrenamientoRow | undefined;

    return row ? mapEntrenamiento(row) : null;
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
    const result = db
      .prepare(
        `
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
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      )
      .run(
        idOrganizador,
        input.codigoDeporte.trim(),
        fechaDb,
        horaDb,
        ubicacion,
        input.distanciaEstimada ?? null,
        input.ritmoObjetivo?.trim() ?? null,
        input.codigoNivel.trim(),
        input.cupoMaximo ?? null
      );

    const insertedId = Number(result.lastInsertRowid);
    if (!insertedId) throw new DatabaseUnavailableError();
    return getById(insertedId);
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
    const result = db
      .prepare(
        `
        UPDATE "ENTRENAMIENTO" SET
          codigo_deporte = ?,
          fecha = ?,
          hora = ?,
          punto_de_encuentro = ?,
          distancia_estimada = ?,
          ritmo_objetivo = ?,
          codigo_nivel = ?,
          cupo_maximo = ?
        WHERE codigo_entrenamiento = ?
      `
      )
      .run(
        input.codigoDeporte.trim(),
        fechaDb,
        horaDb,
        ubicacion,
        input.distanciaEstimada ?? null,
        input.ritmoObjetivo?.trim() ?? null,
        input.codigoNivel.trim(),
        input.cupoMaximo ?? null,
        codigoEntrenamiento
      );

    if (result.changes === 0) {
      throw new NotFoundError("Entrenamiento no encontrado.");
    }

    return getById(codigoEntrenamiento);
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
    const result = db
      .prepare(
        'DELETE FROM "ENTRENAMIENTO" WHERE codigo_entrenamiento = ?'
      )
      .run(codigoEntrenamiento);

    if (result.changes === 0) {
      throw new NotFoundError("Entrenamiento no encontrado.");
    }

    return { deleted: true, codigoEntrenamiento };
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    throwDatabaseUnavailable(error, "remove");
  }
}
