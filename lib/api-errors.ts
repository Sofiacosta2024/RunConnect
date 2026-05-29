export class ApiError extends Error {
  statusCode: number;

  code: string;

  details?: unknown;

  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, details?: unknown) {
    super(400, "VALIDATION_ERROR", message, details);
  }
}

export class EntrenamientoValidationError extends ApiError {
  constructor(message: string, statusCode = 400, details?: unknown) {
    super(statusCode, "VALIDATION_ERROR", message, details);
    this.name = "EntrenamientoValidationError";
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = "Debes iniciar sesion para realizar esta accion.") {
    super(401, "UNAUTHORIZED", message);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = "No tienes permisos para modificar este entrenamiento.") {
    super(403, "FORBIDDEN", message);
  }
}

export class NotFoundError extends ApiError {
  constructor(message = "Recurso no encontrado.") {
    super(404, "NOT_FOUND", message);
  }
}

export class BusinessRuleError extends ApiError {
  constructor(message = "Las reglas de negocio no se cumplieron.") {
    super(422, "BUSINESS_RULE_VIOLATION", message);
  }
}

export class DatabaseUnavailableError extends ApiError {
  constructor(message = "El proveedor externo de base de datos no responde.", pgError?: { code?: string; message?: string }) {
    super(500, "DATABASE_UNAVAILABLE", message, 
      process.env.NODE_ENV !== "production" ? pgError : undefined
    );
  }
}

export class InternalServerError extends ApiError {
  constructor(message = "Error interno del servidor.") {
    super(500, "INTERNAL_SERVER_ERROR", message);
  }
}

export function toApiErrorResponse(error: unknown, fallbackMessage = "No se pudo procesar la solicitud.") {
  const apiError = error instanceof ApiError ? error : new ApiError(500, "INTERNAL_ERROR", fallbackMessage);

  if (apiError.statusCode >= 500) {
    console.error(`[api-error:${apiError.code}]`, apiError.message);
  } else {
    console.warn(`[api-error:${apiError.code}]`, apiError.message);
  }

  return Response.json(
    {
      ok: false,
      error: {
        code: apiError.code,
        message: apiError.message,
        details: apiError.details,
      },
    },
    { status: apiError.statusCode }
  );
}
