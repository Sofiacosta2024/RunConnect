export type ValidarFechasEntrenamientoInput = {
  fechaInicio: string;
  fechaFin: string;
  fechaLimiteInscripcion?: string | null;
  now: Date;
};

export type ValidarFechasEntrenamientoResult = {
  valido: boolean;
  error?: string;
  fechas?: {
    inicio: Date;
    fin: Date;
    limite: Date | null;
  };
};

const MIN_START_OFFSET_MS = 30 * 60 * 1000;
const MIN_DURATION_MS = 15 * 60 * 1000;
const MAX_DURATION_MS = 6 * 60 * 60 * 1000;

type ParsedDateResult =
  | { ok: true; value: Date }
  | { ok: false; error: string };

function normalizeIsoDateTime(value: string) {
  const trimmed = value.trim();
  const withT = trimmed.includes("T") ? trimmed : trimmed.replace(" ", "T");

  if (/^\d{4}-\d{2}-\d{2}$/.test(withT)) {
    return `${withT}T00:00:00Z`;
  }

  const hasTimezone = /[zZ]|[+-]\d{2}:\d{2}$/.test(withT);
  return hasTimezone ? withT : `${withT}Z`;
}

function parseUtcDateTime(value: string, fieldName: string): ParsedDateResult {
  const trimmed = value.trim();

  if (!trimmed) {
    return { ok: false, error: `${fieldName} es obligatoria.` };
  }

  const parsed = new Date(normalizeIsoDateTime(trimmed));

  if (Number.isNaN(parsed.getTime())) {
    return {
      ok: false,
      error: `${fieldName} debe tener formato ISO 8601 valido.`,
    };
  }

  return { ok: true, value: parsed };
}

export function validarFechasEntrenamiento(
  input: ValidarFechasEntrenamientoInput
): ValidarFechasEntrenamientoResult {
  const inicioResult = parseUtcDateTime(input.fechaInicio, "fecha_inicio");
  if (!inicioResult.ok) {
    return { valido: false, error: inicioResult.error };
  }

  const finResult = parseUtcDateTime(input.fechaFin, "fecha_fin");
  if (!finResult.ok) {
    return { valido: false, error: finResult.error };
  }

  const inicio = inicioResult.value;
  const fin = finResult.value;
  const nowMs = input.now.getTime();
  const inicioMs = inicio.getTime();
  const finMs = fin.getTime();

  if (inicioMs < nowMs + MIN_START_OFFSET_MS) {
    return {
      valido: false,
      error: "fecha_inicio debe ser al menos 30 minutos posterior al momento actual.",
    };
  }

  if (finMs <= inicioMs) {
    return { valido: false, error: "fecha_fin debe ser posterior a fecha_inicio." };
  }

  const durationMs = finMs - inicioMs;
  if (durationMs < MIN_DURATION_MS) {
    return {
      valido: false,
      error: "fecha_fin debe ser al menos 15 minutos posterior a fecha_inicio.",
    };
  }

  if (durationMs > MAX_DURATION_MS) {
    return {
      valido: false,
      error: "fecha_fin no puede superar 6 horas desde fecha_inicio.",
    };
  }

  let limite: Date | null = null;
  const limiteRaw = input.fechaLimiteInscripcion;

  if (limiteRaw !== undefined && limiteRaw !== null && String(limiteRaw).trim()) {
    const limiteResult = parseUtcDateTime(String(limiteRaw), "fecha_limite_inscripcion");
    if (!limiteResult.ok) {
      return { valido: false, error: limiteResult.error };
    }

    limite = limiteResult.value;
    const limiteMs = limite.getTime();

    if (limiteMs <= nowMs) {
      return {
        valido: false,
        error: "fecha_limite_inscripcion debe ser posterior a la fecha y hora actual.",
      };
    }

    if (limiteMs > inicioMs) {
      return {
        valido: false,
        error: "fecha_limite_inscripcion debe ser anterior o igual a fecha_inicio.",
      };
    }
  }

  return {
    valido: true,
    fechas: {
      inicio,
      fin,
      limite,
    },
  };
}
