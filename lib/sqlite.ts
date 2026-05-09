import "server-only";

import Database from "better-sqlite3";
import path from "path";

declare global {
  var __runconnectSqlite: Database | undefined;
}

const defaultPath = path.resolve(process.cwd(), "runconnect.sqlite");
const sqlitePath = process.env.SQLITE_DB_PATH?.trim() || defaultPath;

export function getSqliteDb() {
  const cached = globalThis.__runconnectSqlite;
  if (cached) return cached;

  const db = new Database(sqlitePath);
  db.pragma("foreign_keys = ON");

  if (process.env.NODE_ENV !== "production") {
    globalThis.__runconnectSqlite = db;
  }

  return db;
}
