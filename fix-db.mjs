import Database from 'better-sqlite3';

const db = new Database('./runconnect.v2.sqlite');

db.exec(`
  PRAGMA foreign_keys = OFF;

  CREATE TABLE "ENTRENAMIENTO_NEW" (
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

  INSERT INTO "ENTRENAMIENTO_NEW" SELECT
    codigo_entrenamiento, codigo_deporte, fecha_inicio, fecha_fin,
    estado, punto_de_encuentro, distancia_estimada, ritmo_objetivo,
    nivel, cupo_maximo
  FROM "ENTRENAMIENTO";

  DROP TABLE "ENTRENAMIENTO";
  ALTER TABLE "ENTRENAMIENTO_NEW" RENAME TO "ENTRENAMIENTO";

  PRAGMA foreign_keys = ON;
`);

console.log('Listo');