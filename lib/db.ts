import "server-only";

import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

import * as schema from "@/db/schema";

declare global {
  var __runconnectPool: Pool | undefined;
  var __runconnectDb: ReturnType<typeof drizzle> | undefined;
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

export const pool = globalThis.__runconnectPool ?? new Pool({ connectionString });

if (process.env.NODE_ENV !== "production") {
  globalThis.__runconnectPool = pool;
}

export const db = globalThis.__runconnectDb ?? drizzle(pool, { schema });

if (process.env.NODE_ENV !== "production") {
  globalThis.__runconnectDb = db;
}
