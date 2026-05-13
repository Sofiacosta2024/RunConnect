import "server-only";

import { DatabaseUnavailableError, NotFoundError, ValidationError } from "@/lib/api-errors";
import { getSqliteDb } from "@/lib/sqlite";
import { validarFechasEntrenamiento } from "@/lib/entrenamiento-fechas";

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
  fechaInicio: string;
  fechaFin: string;
  fechaLimiteInscripcion: string | null;
  estado: string;
  ubicacion: string | null;
  distanciaEstimada: number | null;
  ritmoObjetivo: string | null;
  codigoNivel: string;
  descripcionNivel: string | null;
  cupoMaximo: number | null;
};

export type EntrenamientoInput = {
  codigoDeporte: string;
  fechaInicio: string;
  fechaFin: string;
  fechaLimiteInscripcion?: string | null;
  estado: string;
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
  fechaInicio: string;
  fechaFin: string;
  fechaLimiteInscripcion: string | null;
  estado: string;
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
    fechaInicio: row.fechaInicio,
    fechaFin: row.fechaFin,
    fechaLimiteInscripcion: row.fechaLimiteInscripcion,
    estado: row.estado,
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

const entrenamientoEstados = new Set([
  "abierto",
  "cerrado",
  "cancelado",
  "finalizado",
]);

function resolveEstado(estado: string) {
  const normalized = estado.trim().toLowerCase();

  if (!normalized) {
    throw new ValidationError("estado es obligatorio.");
  }

  if (!entrenamientoEstados.has(normalized)) {
    throw new ValidationError(
      "estado debe ser uno de: abierto, cerrado, cancelado, finalizado."
    );
  }

  return normalized;
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

  const fechaInicioRaw = input.fechaInicio?.trim();
  const fechaFinRaw = input.fechaFin?.trim();

  if (!fechaInicioRaw) {
    throw new ValidationError("fecha_inicio es obligatoria.");
  }

  if (!fechaFinRaw) {
    throw new ValidationError("fecha_fin es obligatoria.");
  }

  const fechasValidation = validarFechasEntrenamiento({
    fechaInicio: fechaInicioRaw,
    fechaFin: fechaFinRaw,
    fechaLimiteInscripcion: input.fechaLimiteInscripcion ?? null,
    now: new Date(),
  });

  if (!fechasValidation.valido || !fechasValidation.fechas) {
    throw new ValidationError(fechasValidation.error ?? "Fechas invalidas.");
  }

  const { inicio, fin, limite } = fechasValidation.fechas;
  const limiteDb = limite ? limite.toISOString() : null;

  const estado = resolveEstado(input.estado);

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

  return {
    fechaInicioDb: inicio.toISOString(),
    fechaFinDb: fin.toISOString(),
    fechaLimiteInscripcionDb: limiteDb,
    estado,
  };
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
          e.fecha_inicio AS fechaInicio,
          e.fecha_fin AS fechaFin,
          e.fecha_limite_inscripcion AS fechaLimiteInscripcion,
          e.estado AS estado,
          e.punto_de_encuentro AS ubicacion,
          e.distancia_estimada AS distanciaEstimada,
          e.ritmo_objetivo AS ritmoObjetivo,
          e.codigo_nivel AS codigoNivel,
          n.descripcion_nivel AS descripcionNivel,
          e.cupo_maximo AS cupoMaximo
        FROM "ENTRENAMIENTO" e
        INNER JOIN "DEPORTE" d ON d.nombre = e.codigo_deporte
        INNER JOIN "NIVEL_ENTRENAMIENTO" n ON n.nivel = e.codigo_nivel
        ORDER BY e.fecha_inicio DESC, e.codigo_entrenamiento DESC
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
          e.fecha_inicio AS fechaInicio,
          e.fecha_fin AS fechaFin,
          e.fecha_limite_inscripcion AS fechaLimiteInscripcion,
          e.estado AS estado,
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

  const { fechaInicioDb, fechaFinDb, fechaLimiteInscripcionDb, estado } =
    validateInput(input);
  const ubicacion = normalizeLocation(input.ubicacion);

  try {
    const result = db
      .prepare(
        `
        INSERT INTO "ENTRENAMIENTO" (
          id_organizador,
          codigo_deporte,
          fecha_inicio,
          fecha_fin,
          fecha_limite_inscripcion,
          estado,
          punto_de_encuentro,
          distancia_estimada,
          ritmo_objetivo,
          codigo_nivel,
          cupo_maximo
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      )
      .run(
        idOrganizador,
        input.codigoDeporte.trim(),
        fechaInicioDb,
        fechaFinDb,
        fechaLimiteInscripcionDb,
        estado,
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

  const { fechaInicioDb, fechaFinDb, fechaLimiteInscripcionDb, estado } =
    validateInput(input);
  const ubicacion = normalizeLocation(input.ubicacion);

  try {
    const result = db
      .prepare(
        `
        UPDATE "ENTRENAMIENTO" SET
          codigo_deporte = ?,
          fecha_inicio = ?,
          fecha_fin = ?,
          fecha_limite_inscripcion = ?,
          estado = ?,
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
        fechaInicioDb,
        fechaFinDb,
        fechaLimiteInscripcionDb,
        estado,
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
