import Database from "better-sqlite3";
import path from "path";

const dbPath = process.env.SQLITE_DB_PATH?.trim() || path.resolve(process.cwd(), "runconnect.sqlite");
const db = new Database(dbPath);

try {
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS "DEPORTE" (
      nombre TEXT PRIMARY KEY,
      descripcion_deporte TEXT
    );

    CREATE TABLE IF NOT EXISTS "USUARIO" (
      email TEXT PRIMARY KEY,
      nombre TEXT NOT NULL,
      foto_perfil TEXT,
      ubicacion TEXT,
      codigo_deporte TEXT,
      FOREIGN KEY (codigo_deporte) REFERENCES "DEPORTE"(nombre)
    );

    CREATE TABLE IF NOT EXISTS "ENTRENAMIENTO" (
      codigo_entrenamiento INTEGER PRIMARY KEY AUTOINCREMENT,
      codigo_deporte TEXT NOT NULL,
      fecha_inicio TEXT NOT NULL,
      fecha_fin TEXT NOT NULL,
      estado TEXT NOT NULL DEFAULT 'abierto',
      punto_de_encuentro TEXT NOT NULL,
      distancia_estimada REAL,
      ritmo_objetivo TEXT,
      nivel TEXT NOT NULL,
      cupo_maximo INTEGER,
      FOREIGN KEY (codigo_deporte) REFERENCES "DEPORTE"(nombre),
      CHECK (nivel IN ('principiante', 'intermedio', 'avanzado'))
    );

    CREATE TABLE IF NOT EXISTS "USUARIO_ENTRENAMIENTO" (
      codigo_entrenamiento INTEGER NOT NULL,
      email TEXT NOT NULL,
      rol TEXT NOT NULL,
      PRIMARY KEY (codigo_entrenamiento, email),
      FOREIGN KEY (email) REFERENCES "USUARIO"(email),
      FOREIGN KEY (codigo_entrenamiento) REFERENCES "ENTRENAMIENTO"(codigo_entrenamiento)
    );

    CREATE TABLE IF NOT EXISTS "MENSAJE" (
      codigo_mensaje INTEGER PRIMARY KEY AUTOINCREMENT,
      fecha TEXT NOT NULL,
      hora TEXT NOT NULL,
      codigo_entrenamiento INTEGER NOT NULL,
      email TEXT NOT NULL,
      contenido TEXT NOT NULL,
      FOREIGN KEY (codigo_entrenamiento, email)
        REFERENCES "USUARIO_ENTRENAMIENTO"(codigo_entrenamiento, email)
    );

    CREATE TABLE IF NOT EXISTS "SOLICITUD" (
      codigo_solicitud INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      codigo_entrenamiento INTEGER NOT NULL,
      estado TEXT NOT NULL DEFAULT 'pendiente',
      fecha TEXT NOT NULL,
      FOREIGN KEY (email) REFERENCES "USUARIO"(email),
      FOREIGN KEY (codigo_entrenamiento) REFERENCES "ENTRENAMIENTO"(codigo_entrenamiento),
      CHECK (estado IN ('aprobado', 'rechazado', 'pendiente'))
    );

    CREATE TABLE IF NOT EXISTS "GRUPO_SOLICITUD" (
      codigo_entrenamiento INTEGER NOT NULL,
      email TEXT NOT NULL,
      PRIMARY KEY (codigo_entrenamiento, email),
      FOREIGN KEY (email) REFERENCES "USUARIO"(email),
      FOREIGN KEY (codigo_entrenamiento) REFERENCES "ENTRENAMIENTO"(codigo_entrenamiento)
    );
  `);

  const insertDeporte = db.prepare(
    'INSERT OR IGNORE INTO "DEPORTE" (nombre, descripcion_deporte) VALUES (?, ?)'
  );
  insertDeporte.run("RUN", "Running");

  const insertUsuario = db.prepare(
    'INSERT OR IGNORE INTO "USUARIO" (email, nombre, foto_perfil, ubicacion, codigo_deporte) VALUES (?, ?, ?, ?, ?)'
  );
  insertUsuario.run(
    "local@runconnect.test",
    "Local Organizer",
    null,
    "Buenos Aires",
    "RUN"
  );

  const countEntrenamientos = db.prepare(
    'SELECT COUNT(*) as count FROM "ENTRENAMIENTO"'
  ).get();

  if (Number(countEntrenamientos.count) === 0) {
    const insertEntrenamiento = db.prepare(`
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
    `);

    insertEntrenamiento.run(
      "RUN",
      "2026-05-08T18:30:00Z",
      "2026-05-08T20:30:00Z",
      "abierto",
      "POINT(-58.3816 -34.6037)",
      5.0,
      "5:30/km",
      "intermedio",
      20
    );

    const trainingIdRow = db
      .prepare('SELECT codigo_entrenamiento AS id FROM "ENTRENAMIENTO" LIMIT 1')
      .get();
    const trainingId = trainingIdRow?.id;

    if (typeof trainingId === "number") {
      db.prepare(
        `
        INSERT INTO "USUARIO_ENTRENAMIENTO" (
          codigo_entrenamiento,
          email,
          rol
        ) VALUES (?, ?, ?)
      `
      ).run(trainingId, "local@runconnect.test", "organizador");
    }
  }

  console.log(`SQLite inicializado en: ${dbPath}`);
} finally {
  db.close();
}
