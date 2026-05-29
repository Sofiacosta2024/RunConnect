import "server-only";

import {
  DatabaseUnavailableError,
  EntrenamientoValidationError,
  NotFoundError,
  ValidationError,
} from "@/lib/api-errors";
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
  distanciaEstimada: number | null;
  ritmoObjetivo: string | null;
  nivel: string;
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

    if (trimmed.startsWith("SRID=")) {
      const parts = trimmed.split(";");
      return parts.slice(1).join(";") || trimmed;
    }

    return trimmed;
  }

  const latitude = puntoEncuentro.latitude ?? puntoEncuentro.lat;
  const longitude = puntoEncuentro.longitude ?? puntoEncuentro.lng;

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new EntrenamientoValidationError("ubicacion debe contener coordenadas validas.");
  }

  return `POINT(${longitude} ${latitude})`;
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
          e.email_organizador AS emailOrganizador,
          e.codigo_deporte AS codigoDeporte,
          d.descripcion_deporte AS descripcionDeporte,
          e.fecha_inicio AS fechaInicio,
          e.fecha_fin AS fechaFin,
          e.estado AS estado,
          e.punto_de_encuentro AS puntoEncuentro,
          e.distancia_estimada AS distanciaEstimada,
          e.ritmo_objetivo AS ritmoObjetivo,
          e.nivel AS nivel,
          e.cupo_maximo AS cupoMaximo
        FROM "ENTRENAMIENTO" e
        INNER JOIN "DEPORTE" d ON d.nombre = e.codigo_deporte
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
          e.email_organizador AS emailOrganizador,
          e.codigo_deporte AS codigoDeporte,
          d.descripcion_deporte AS descripcionDeporte,
          e.fecha_inicio AS fechaInicio,
          e.fecha_fin AS fechaFin,
          e.estado AS estado,
          e.punto_de_encuentro AS puntoEncuentro,
          e.distancia_estimada AS distanciaEstimada,
          e.ritmo_objetivo AS ritmoObjetivo,
          e.nivel AS nivel,
          e.cupo_maximo AS cupoMaximo
        FROM "ENTRENAMIENTO" e
        INNER JOIN "DEPORTE" d ON d.nombre = e.codigo_deporte
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

export async function create(emailOrganizador: string, input: EntrenamientoInput) {
  const organizerEmail = emailOrganizador?.trim();

  if (!organizerEmail) {
    throw new ValidationError("emailOrganizador es obligatorio.");
  }

  const { fechaInicioDb, fechaFinDb, estado, nivel } = validateInput(input);
  const puntoEncuentro = normalizePuntoEncuentro(input.puntoEncuentro);

  try {
    const result = db
      .prepare(
        `
        INSERT INTO "ENTRENAMIENTO" (
          email_organizador,
          codigo_deporte,
          fecha_inicio,
          fecha_fin,
          estado,
          punto_de_encuentro,
          distancia_estimada,
          ritmo_objetivo,
          nivel,
          cupo_maximo
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      )
      .run(
        organizerEmail,
        input.codigoDeporte.trim(),
        fechaInicioDb,
        fechaFinDb,
        estado,
        puntoEncuentro,
        input.distanciaEstimada ?? null,
        input.ritmoObjetivo?.trim() ?? null,
        nivel,
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

  const { fechaInicioDb, fechaFinDb, estado, nivel } = validateInput(input);
  const puntoEncuentro = normalizePuntoEncuentro(input.puntoEncuentro);

  try {
    const result = db
      .prepare(
        `
        UPDATE "ENTRENAMIENTO" SET
          codigo_deporte = ?,
          fecha_inicio = ?,
          fecha_fin = ?,
          estado = ?,
          punto_de_encuentro = ?,
          distancia_estimada = ?,
          ritmo_objetivo = ?,
          nivel = ?,
          cupo_maximo = ?
        WHERE codigo_entrenamiento = ?
      `
      )
      .run(
        input.codigoDeporte.trim(),
        fechaInicioDb,
        fechaFinDb,
        estado,
        puntoEncuentro,
        input.distanciaEstimada ?? null,
        input.ritmoObjetivo?.trim() ?? null,
        nivel,
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
    const transaction = db.transaction(() => {
      // Usamos transaccion para garantizar atomicidad en modo local.
      const userRow = db
        .prepare('SELECT email FROM "USUARIO" WHERE email = ? LIMIT 1')
        .get(organizerEmail) as { email?: string } | undefined;

      if (!userRow?.email) {
        throw new NotFoundError("Usuario no encontrado.");
      }

      const insertResult = db
        .prepare(
          `
          INSERT INTO "ENTRENAMIENTO" (
            email_organizador,
            codigo_deporte,
            fecha_inicio,
            fecha_fin,
            estado,
            punto_de_encuentro,
            distancia_estimada,
            ritmo_objetivo,
            nivel,
            cupo_maximo
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `
        )
        .run(
          organizerEmail,
          input.codigoDeporte.trim(),
          fechaInicioDb,
          fechaFinDb,
          "abierto",
          puntoEncuentro,
          input.distanciaEstimada ?? null,
          input.ritmoObjetivo?.trim() ?? null,
          nivel,
          input.cupoMaximo ?? null
        );

      const codigoEntrenamiento = Number(insertResult.lastInsertRowid);
      if (!codigoEntrenamiento) throw new DatabaseUnavailableError();

      const now = new Date();
      const fechaMensaje = now.toISOString().slice(0, 10);
      const horaMensaje = now.toISOString().slice(11, 19);

      db.prepare(
        `
        INSERT INTO "USUARIO_ENTRENAMIENTO" (
          codigo_entrenamiento,
          email,
          codigo_calificacion,
          rol
        ) VALUES (?, ?, ?, ?)
      `
      ).run(codigoEntrenamiento, organizerEmail, null, "organizador");

      db.prepare(
        `
        INSERT INTO "USUARIO_MENSAJE_ENTRENAMIENTO" (
          codigo_entrenamiento,
          email
        ) VALUES (?, ?)
      `
      ).run(codigoEntrenamiento, organizerEmail);

      db.prepare(
        `
        INSERT INTO "MENSAJE" (
          fecha,
          hora,
          codigo_entrenamiento,
          email,
          contenido
        ) VALUES (?, ?, ?, ?, ?)
      `
      ).run(
        fechaMensaje,
        horaMensaje,
        codigoEntrenamiento,
        organizerEmail,
        welcomeMessage
      );

      return codigoEntrenamiento;
    });

    const insertedId = transaction();
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
