import "server-only";

import { ForbiddenError, UnauthorizedError, ValidationError } from "@/lib/api-errors";

function parseLocalOrganizerEmail(rawValue: string | null) {
  if (!rawValue) {
    throw new UnauthorizedError();
  }

  const trimmed = rawValue.trim();

  if (!trimmed || !trimmed.includes("@")) {
    throw new ValidationError("x-organizer-email debe ser un correo valido.");
  }

  return trimmed;
}

export async function getAuthenticatedOrganizerEmail(headers: Headers) {
  if (process.env.DB_MODE === "sqlite") {
    const headerEmail = headers.get("x-organizer-email");
    const envEmail = process.env.LOCAL_ORGANIZER_EMAIL ?? null;

    return parseLocalOrganizerEmail(headerEmail ?? envEmail);
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

  const result = await pool.query<{ email: string }>(
    'SELECT email FROM "USUARIO" WHERE email = $1 LIMIT 1',
    [email]
  );

  const usuario = result.rows[0];

  if (!usuario) {
    throw new ForbiddenError("La cuenta autenticada no esta registrada.");
  }

  return email;
}
