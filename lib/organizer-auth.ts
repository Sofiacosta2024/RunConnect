import "server-only";

import { ForbiddenError, UnauthorizedError, ValidationError } from "@/lib/api-errors";

function parseLocalOrganizerId(rawValue: string | null) {
  if (!rawValue) {
    throw new UnauthorizedError();
  }

  const parsed = Number(rawValue);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ValidationError("x-organizer-id debe ser un entero positivo.");
  }

  return parsed;
}

export async function getAuthenticatedOrganizerId(headers: Headers) {
  if (process.env.DB_MODE === "sqlite") {
    const headerId = headers.get("x-organizer-id");
    const envId = process.env.LOCAL_ORGANIZER_ID ?? null;

    return parseLocalOrganizerId(headerId ?? envId);
  }

  const cookieHeader = headers.get("cookie");

  if (!cookieHeader) {
    throw new UnauthorizedError();
  }

  const { getServerSession } = await import("@/lib/auth-server");
  const { pool } = await import("@/lib/db");

  const session = await getServerSession(headers);

  const email = session?.user?.email;

  if (!email) {
    throw new UnauthorizedError();
  }

  const result = await pool.query<{ id_organizador: number }>(
    'SELECT id_organizador FROM "ORGANIZADOR" WHERE email = $1 LIMIT 1',
    [email]
  );

  const organizer = result.rows[0];

  if (!organizer) {
    throw new ForbiddenError("La cuenta autenticada no tiene perfil de organizador.");
  }

  return organizer.id_organizador;
}
