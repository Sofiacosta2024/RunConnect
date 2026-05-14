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

    CREATE TABLE IF NOT EXISTS "NIVEL_ENTRENAMIENTO" (
      nivel TEXT PRIMARY KEY,
      descripcion_nivel TEXT
    );

    CREATE TABLE IF NOT EXISTS "USUARIO" (
      email TEXT PRIMARY KEY,
      nombre TEXT NOT NULL,
      foto_perfil TEXT,
      ubicacion TEXT,
      codigo_deporte TEXT,
      FOREIGN KEY (codigo_deporte) REFERENCES "DEPORTE"(nombre)
    );

    CREATE TABLE IF NOT EXISTS "ORGANIZADOR" (
      id_organizador INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      FOREIGN KEY (email) REFERENCES "USUARIO"(email)
    );

    CREATE TABLE IF NOT EXISTS "ENTRENAMIENTO" (
      codigo_entrenamiento INTEGER PRIMARY KEY AUTOINCREMENT,
      id_organizador INTEGER NOT NULL,
      codigo_deporte TEXT NOT NULL,
      fecha_inicio TEXT NOT NULL,
      fecha_fin TEXT NOT NULL,
      fecha_limite_inscripcion TEXT,
      estado TEXT NOT NULL DEFAULT 'abierto',
      punto_de_encuentro TEXT NOT NULL,
      distancia_estimada REAL,
      ritmo_objetivo TEXT,
      codigo_nivel TEXT NOT NULL,
      cupo_maximo INTEGER,
      FOREIGN KEY (id_organizador) REFERENCES "ORGANIZADOR"(id_organizador),
      FOREIGN KEY (codigo_deporte) REFERENCES "DEPORTE"(nombre),
      FOREIGN KEY (codigo_nivel) REFERENCES "NIVEL_ENTRENAMIENTO"(nivel)
    );

    CREATE TABLE IF NOT EXISTS "PARTICIPACION" (
      email TEXT NOT NULL,
      codigo_entrenamiento INTEGER NOT NULL,
      fecha_inscripcion TEXT NOT NULL,
      PRIMARY KEY (email, codigo_entrenamiento),
      FOREIGN KEY (email) REFERENCES "USUARIO"(email),
      FOREIGN KEY (codigo_entrenamiento) REFERENCES "ENTRENAMIENTO"(codigo_entrenamiento)
    );

    CREATE TABLE IF NOT EXISTS "MENSAJE" (
      fecha TEXT NOT NULL,
      hora TEXT NOT NULL,
      codigo_entrenamiento INTEGER NOT NULL,
      email TEXT NOT NULL,
      contenido TEXT NOT NULL,
      PRIMARY KEY (fecha, hora),
      FOREIGN KEY (codigo_entrenamiento) REFERENCES "ENTRENAMIENTO"(codigo_entrenamiento),
      FOREIGN KEY (email) REFERENCES "USUARIO"(email)
    );
  `);

  const insertDeporte = db.prepare(
    'INSERT OR IGNORE INTO "DEPORTE" (nombre, descripcion_deporte) VALUES (?, ?)'
  );
  insertDeporte.run("RUN", "Running");

  const insertNivel = db.prepare(
    'INSERT OR IGNORE INTO "NIVEL_ENTRENAMIENTO" (nivel, descripcion_nivel) VALUES (?, ?)'
  );
  insertNivel.run("INTERMEDIO", "Nivel intermedio");

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

  const insertOrganizador = db.prepare(
    'INSERT OR IGNORE INTO "ORGANIZADOR" (id_organizador, email) VALUES (?, ?)'
  );
  insertOrganizador.run(1, "local@runconnect.test");

  const countEntrenamientos = db.prepare(
    'SELECT COUNT(*) as count FROM "ENTRENAMIENTO"'
  ).get();

  if (Number(countEntrenamientos.count) === 0) {
    const insertEntrenamiento = db.prepare(`
      INSERT INTO "ENTRENAMIENTO" (
        id_organizador,
        codigo_deporte,
        fecha_inicio,
        fecha_fin,
        fecha_limite_inscripcion,
        estado,
        punto_de_encuentro,
        distancia_estimada,
        ritmo_objetivo,
        codigo_nivel,
        cupo_maximo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertEntrenamiento.run(
      1,
      "RUN",
      "2026-05-08T18:30:00Z",
      "2026-05-08T20:30:00Z",
      "2026-05-08T16:00:00Z",
      "abierto",
      "POINT(-58.3816 -34.6037)",
      5.0,
      "5:30/km",
      "INTERMEDIO",
      20
    );
  }

  console.log(`SQLite inicializado en: ${dbPath}`);
} finally {
  db.close();
}
