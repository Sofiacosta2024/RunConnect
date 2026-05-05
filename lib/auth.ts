import "server-only";

import { betterAuth } from "better-auth";
import { Pool } from "@neondatabase/serverless";

let pool: Pool | undefined;

function getPool() {
  if (pool) return pool;

  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  return pool;
}

function createAuth() {
  return betterAuth({
    baseURL: process.env.BETTER_AUTH_URL,
    secret: process.env.BETTER_AUTH_SECRET,
    database: getPool(),
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID as string,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      },
    },
  });
}

type AuthInstance = ReturnType<typeof createAuth>;

let auth: AuthInstance | undefined;

export function getAuth(): AuthInstance {
  if (!auth) {
    auth = createAuth();
  }

  return auth;
}
