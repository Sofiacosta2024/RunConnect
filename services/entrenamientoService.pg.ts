import {
  DatabaseUnavailableError,
  EntrenamientoValidationError,
  NotFoundError,
  ValidationError,
} from "@/lib/api-errors";
import { db } from "@/lib/db";
import { entrenamiento, deporte, nivelEntrenamiento } from "@/db/schema";
import { validarFechasEntrenamiento } from "@/lib/entrenamiento-fechas";
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

type EntrenamientoChatInput = Omit<EntrenamientoInput, "estado">;

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
    throw new EntrenamientoValidationError("estado es obligatorio.");
  }

  if (!entrenamientoEstados.has(normalized)) {
    throw new EntrenamientoValidationError(
      "estado debe ser uno de: abierto, cerrado, cancelado, finalizado."
    );
  }

  return normalized;
}

function normalizeLocation(ubicacion: LocationInput) {
  if (typeof ubicacion === "string") {
    const trimmed = ubicacion.trim();

    if (!trimmed) {
      throw new EntrenamientoValidationError("ubicacion es obligatoria.");
    }

    return trimmed;
  }

  const latitude = ubicacion.latitude ?? ubicacion.lat;
  const longitude = ubicacion.longitude ?? ubicacion.lng;

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new EntrenamientoValidationError("ubicacion debe contener coordenadas validas.");
  }

  return `SRID=4326;POINT(${longitude} ${latitude})`;
}

function validateInput(input: EntrenamientoInput) {
  if (!input.codigoDeporte?.trim()) {
    throw new EntrenamientoValidationError("codigoDeporte es obligatorio.");
  }

  if (!input.codigoNivel?.trim()) {
    throw new EntrenamientoValidationError("codigoNivel es obligatorio.");
  }

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
    fechaLimiteInscripcion: input.fechaLimiteInscripcion ?? null,
    now: new Date(),
  });

  if (!fechasValidation.valido || !fechasValidation.fechas) {
    throw new EntrenamientoValidationError(
      fechasValidation.error ?? "Fechas invalidas."
    );
  }

  const { inicio, fin, limite } = fechasValidation.fechas;
  const limiteDb = limite ? limite.toISOString() : null;

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
    fechaLimiteInscripcionDb: limiteDb,
    estado,
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
        idOrganizador: entrenamiento.idOrganizador,
        codigoDeporte: entrenamiento.codigoDeporte,
        descripcionDeporte: deporte.descripcionDeporte,
        fechaInicio: sql`${entrenamiento.fechaInicio}::text`,
        fechaFin: sql`${entrenamiento.fechaFin}::text`,
        fechaLimiteInscripcion: sql`${entrenamiento.fechaLimiteInscripcion}::text`,
        estado: entrenamiento.estado,
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
      .orderBy(desc(entrenamiento.fechaInicio), desc(entrenamiento.codigoEntrenamiento));

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
        fechaInicio: sql`${entrenamiento.fechaInicio}::text`,
        fechaFin: sql`${entrenamiento.fechaFin}::text`,
        fechaLimiteInscripcion: sql`${entrenamiento.fechaLimiteInscripcion}::text`,
        estado: entrenamiento.estado,
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

  const { fechaInicioDb, fechaFinDb, fechaLimiteInscripcionDb, estado } =
    validateInput(input);

  const ubicacion = normalizeLocation(input.ubicacion);

  try {
    const insertResult = await db.execute(sql`
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
      ) VALUES (
        ${idOrganizador},
        ${input.codigoDeporte.trim()},
        ${fechaInicioDb}::timestamptz,
        ${fechaFinDb}::timestamptz,
        ${fechaLimiteInscripcionDb}::timestamptz,
        ${estado},
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

export async function crearEntrenamientoConChat(
  idOrganizador: number,
  input: EntrenamientoChatInput
) {
  if (!isFinitePositiveInteger(idOrganizador)) {
    throw new ValidationError("idOrganizador debe ser un entero positivo.");
  }

  const { fechaInicioDb, fechaFinDb, fechaLimiteInscripcionDb } = validateInput({
    ...input,
    estado: "abierto",
  });

  const ubicacion = normalizeLocation(input.ubicacion);
  const welcomeMessage = "Entrenamiento creado. El chat esta disponible.";

  try {
    const insertedId = await db.transaction(async (tx) => {
      // Usamos transaccion para asegurar que entrenamiento, participacion y mensaje
      // se creen juntos o se reviertan en caso de error.
      const organizerResult = await tx.execute(sql`
        SELECT email
        FROM "ORGANIZADOR"
        WHERE id_organizador = ${idOrganizador}
        LIMIT 1
      `);

      const organizerEmail = organizerResult.rows?.[0]?.email as string | undefined;

      if (!organizerEmail) {
        throw new NotFoundError("Organizador no encontrado.");
      }

      const insertResult = await tx.execute(sql`
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
        ) VALUES (
          ${idOrganizador},
          ${input.codigoDeporte.trim()},
          ${fechaInicioDb}::timestamptz,
          ${fechaFinDb}::timestamptz,
          ${fechaLimiteInscripcionDb}::timestamptz,
          ${"abierto"},
          ST_GeogFromText(${ubicacion}),
          ${input.distanciaEstimada ?? null},
          ${input.ritmoObjetivo?.trim() ?? null},
          ${input.codigoNivel.trim()},
          ${input.cupoMaximo ?? null}
        ) RETURNING codigo_entrenamiento
      `);

      const codigoEntrenamiento = insertResult.rows?.[0]?.codigo_entrenamiento;
      if (!codigoEntrenamiento) throw new DatabaseUnavailableError();

      const now = new Date();
      const fechaMensaje = now.toISOString().slice(0, 10);
      const horaMensaje = now.toISOString().slice(11, 19);

      await tx.execute(sql`
        INSERT INTO "PARTICIPACION" (
          email,
          codigo_entrenamiento,
          fecha_inscripcion
        ) VALUES (
          ${organizerEmail},
          ${codigoEntrenamiento},
          ${now.toISOString()}::timestamptz
        )
      `);

      await tx.execute(sql`
        INSERT INTO "MENSAJE" (
          fecha,
          hora,
          codigo_entrenamiento,
          email,
          contenido
        ) VALUES (
          ${fechaMensaje}::date,
          ${horaMensaje}::time,
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

  const { fechaInicioDb, fechaFinDb, fechaLimiteInscripcionDb, estado } =
    validateInput(input);

  const ubicacion = normalizeLocation(input.ubicacion);

  try {
    const updateResult = await db.execute(sql`
      UPDATE "ENTRENAMIENTO" SET
        codigo_deporte = ${input.codigoDeporte.trim()},
        fecha_inicio = ${fechaInicioDb}::timestamptz,
        fecha_fin = ${fechaFinDb}::timestamptz,
        fecha_limite_inscripcion = ${fechaLimiteInscripcionDb}::timestamptz,
        estado = ${estado},
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
