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

export interface GetFilteredParams {
  codigoDeporte?: string;
  nivel?: string;
  fecha?: string;
  lat?: number;
  lng?: number;
  radioKm?: number;
}

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
          ue.email AS emailOrganizador,
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
        INNER JOIN "USUARIO_ENTRENAMIENTO" ue
          ON ue.codigo_entrenamiento = e.codigo_entrenamiento
         AND ue.rol = ?
        ORDER BY e.fecha_inicio DESC, e.codigo_entrenamiento DESC
      `
      )
      .all(rolOrganizador);

    return rows.map((row: EntrenamientoRow) => mapEntrenamiento(row));
  } catch (error) {
    throwDatabaseUnavailable(error, "getAll");
  }
}

function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function parsePointCoords(wkt: string): { lat: number; lng: number } | null {
  const match = wkt.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);
  if (!match) return null;
  return { lng: parseFloat(match[1]), lat: parseFloat(match[2]) };
}

export async function getFiltered(params: GetFilteredParams = {}) {
  try {
    const conditions: string[] = ["e.fecha_inicio > datetime('now')"];

    if (params.codigoDeporte) {
      conditions.push("e.codigo_deporte = ?");
    }
    if (params.nivel) {
      conditions.push("e.nivel = ?");
    }
    if (params.fecha) {
      conditions.push("e.fecha_inicio >= ?");
    }

    const whereClause = conditions.join(" AND ");
    const queryParams: (string | number)[] = [];

    if (params.codigoDeporte) queryParams.push(params.codigoDeporte);
    if (params.nivel) queryParams.push(params.nivel);
    if (params.fecha) queryParams.push(params.fecha);

    const sql = `
      SELECT
        e.codigo_entrenamiento AS codigoEntrenamiento,
        ue.email AS emailOrganizador,
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
      INNER JOIN "USUARIO_ENTRENAMIENTO" ue
        ON ue.codigo_entrenamiento = e.codigo_entrenamiento
       AND ue.rol = ?
      WHERE ${whereClause}
      ORDER BY e.fecha_inicio ASC
    `;

    const rows = db.prepare(sql).all(rolOrganizador, ...queryParams) as EntrenamientoRow[];

    let result = rows.map((row) => mapEntrenamiento(row));

    if (params.lat !== undefined && params.lng !== undefined) {
      const radioKm = params.radioKm ?? 10;
      result = result.filter((item) => {
        if (!item.puntoEncuentro) return false;
        const coords = parsePointCoords(item.puntoEncuentro);
        if (!coords) return false;
        const dist = haversineDistance(params.lat!, params.lng!, coords.lat, coords.lng);
        return dist <= radioKm;
      });
    }

    return result;
  } catch (error) {
    throwDatabaseUnavailable(error, "getFiltered");
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
          ue.email AS emailOrganizador,
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
        INNER JOIN "USUARIO_ENTRENAMIENTO" ue
          ON ue.codigo_entrenamiento = e.codigo_entrenamiento
         AND ue.rol = ?
        WHERE e.codigo_entrenamiento = ?
        LIMIT 1
      `
      )
      .get(rolOrganizador, codigoEntrenamiento) as EntrenamientoRow | undefined;

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
    const transaction = db.transaction(() => {
      const userRow = db
        .prepare('SELECT email FROM "USUARIO" WHERE email = ? LIMIT 1')
        .get(organizerEmail) as { email?: string } | undefined;

      if (!userRow?.email) {
        throw new NotFoundError("Usuario no encontrado.");
      }

      const result = db
        .prepare(
          `
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
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
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
          input.cupoMaximo ?? null
        );

      const codigoEntrenamiento = Number(result.lastInsertRowid);
      if (!codigoEntrenamiento) throw new DatabaseUnavailableError();

      db.prepare(
        `
        INSERT INTO "USUARIO_ENTRENAMIENTO" (
          codigo_entrenamiento,
          email,
          rol
        ) VALUES (?, ?, ?)
      `
      ).run(codigoEntrenamiento, organizerEmail, rolOrganizador);

      return codigoEntrenamiento;
    });

    const insertedId = transaction();
    return getById(insertedId);
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
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
            codigo_deporte,
            fecha_inicio,
            fecha_fin,
            estado,
            punto_de_encuentro,
            distancia_estimada,
            ritmo_objetivo,
            nivel,
            cupo_maximo
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `
        )
        .run(
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
          rol
        ) VALUES (?, ?, ?)
      `
      ).run(codigoEntrenamiento, organizerEmail, rolOrganizador);

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
