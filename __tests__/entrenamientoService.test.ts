/**
 * Entrenamiento + Chat Integration Tests (RN-03)
 *
 * Validates:
 * - Happy path creates entrenamiento, usuario_entrenamiento, and mensaje
 * - Atomicity: rollback when USUARIO_ENTRENAMIENTO insert fails
 * - Business rules for fechas
 */

process.env.DB_MODE = "sqlite";
process.env.SQLITE_DB_PATH = ":memory:";

const { EntrenamientoValidationError } = await import("../lib/api-errors.ts");
const { getSqliteDb } = await import("../lib/sqlite.ts");
const { crearEntrenamientoConChat } = await import(
  "../services/entrenamientoService.sqlite.ts"
);

const db = getSqliteDb();
const results: { name: string; passed: boolean; error?: string }[] = [];

const welcomeMessage = "Entrenamiento creado. El chat esta disponible.";

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    results.push({ name, passed: true });
    console.log(`✓ ${name}`);
  } catch (error) {
    results.push({
      name,
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    });
    console.log(`✗ ${name}`);
    console.log(`  Error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function resetDatabase() {
  db.exec(`
    DROP TABLE IF EXISTS "MENSAJE";
    DROP TABLE IF EXISTS "USUARIO_ENTRENAMIENTO";
    DROP TABLE IF EXISTS "SOLICITUD";
    DROP TABLE IF EXISTS "GRUPO_SOLICITUD";
    DROP TABLE IF EXISTS "ENTRENAMIENTO";
    DROP TABLE IF EXISTS "USUARIO";
    DROP TABLE IF EXISTS "DEPORTE";

    CREATE TABLE "DEPORTE" (
      nombre TEXT PRIMARY KEY,
      descripcion_deporte TEXT
    );

    CREATE TABLE "USUARIO" (
      email TEXT PRIMARY KEY,
      nombre TEXT NOT NULL,
      foto_perfil TEXT,
      ubicacion TEXT,
      codigo_deporte TEXT,
      FOREIGN KEY (codigo_deporte) REFERENCES "DEPORTE"(nombre)
    );

    CREATE TABLE "ENTRENAMIENTO" (
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

    CREATE TABLE "USUARIO_ENTRENAMIENTO" (
      codigo_entrenamiento INTEGER NOT NULL,
      email TEXT NOT NULL,
      rol TEXT NOT NULL,
      PRIMARY KEY (codigo_entrenamiento, email),
      FOREIGN KEY (email) REFERENCES "USUARIO"(email),
      FOREIGN KEY (codigo_entrenamiento) REFERENCES "ENTRENAMIENTO"(codigo_entrenamiento)
    );

    CREATE TABLE "MENSAJE" (
      codigo_mensaje INTEGER PRIMARY KEY AUTOINCREMENT,
      fecha TEXT NOT NULL,
      hora TEXT NOT NULL,
      codigo_entrenamiento INTEGER NOT NULL,
      email TEXT NOT NULL,
      contenido TEXT NOT NULL,
      FOREIGN KEY (codigo_entrenamiento, email)
        REFERENCES "USUARIO_ENTRENAMIENTO"(codigo_entrenamiento, email)
    );

    CREATE TABLE "SOLICITUD" (
      codigo_solicitud INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      codigo_entrenamiento INTEGER NOT NULL,
      estado TEXT NOT NULL DEFAULT 'pendiente',
      fecha TEXT NOT NULL,
      FOREIGN KEY (email) REFERENCES "USUARIO"(email),
      FOREIGN KEY (codigo_entrenamiento) REFERENCES "ENTRENAMIENTO"(codigo_entrenamiento),
      CHECK (estado IN ('aprobado', 'rechazado', 'pendiente'))
    );

    CREATE TABLE "GRUPO_SOLICITUD" (
      codigo_entrenamiento INTEGER NOT NULL,
      email TEXT NOT NULL,
      PRIMARY KEY (codigo_entrenamiento, email),
      FOREIGN KEY (email) REFERENCES "USUARIO"(email),
      FOREIGN KEY (codigo_entrenamiento) REFERENCES "ENTRENAMIENTO"(codigo_entrenamiento)
    );
  `);

  db.prepare(
    'INSERT INTO "DEPORTE" (nombre, descripcion_deporte) VALUES (?, ?)'
  ).run("RUN", "Running");
  db.prepare(
    'INSERT INTO "USUARIO" (email, nombre, foto_perfil, ubicacion, codigo_deporte) VALUES (?, ?, ?, ?, ?)'
  ).run("local@runconnect.test", "Local Organizer", null, "Buenos Aires", "RUN");
}

function countRows(table: string) {
  const row = db.prepare(`SELECT COUNT(*) as count FROM "${table}"`).get() as {
    count: number;
  };
  return Number(row.count);
}

async function main() {
  console.log(`\n🧪 Running Entrenamiento RN-03 Integration Tests\n`);

  await test("Happy path creates entrenamiento + chat", async () => {
    // QA: Consistencia de datos y funcionalidad end-to-end.
    resetDatabase();

    const now = new Date();
    const startIso = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
    const endIso = new Date(new Date(startIso).getTime() + 2 * 60 * 60 * 1000).toISOString();
    const entrenamiento = await crearEntrenamientoConChat("local@runconnect.test", {
      codigoDeporte: "RUN",
      fechaInicio: startIso,
      fechaFin: endIso,
      puntoEncuentro: "POINT(-58.3816 -34.6037)",
      distanciaEstimada: 5.0,
      ritmoObjetivo: "5:30/km",
      nivel: "intermedio",
      cupoMaximo: 20,
    });

    if (!entrenamiento) throw new Error("No se retorno el entrenamiento creado.");
    if (entrenamiento.estado !== "abierto") {
      throw new Error("El estado debe ser 'abierto'.");
    }

    if (countRows("ENTRENAMIENTO") !== 1) {
      throw new Error("ENTRENAMIENTO debe tener 1 registro.");
    }
    if (countRows("USUARIO_ENTRENAMIENTO") !== 1) {
      throw new Error("USUARIO_ENTRENAMIENTO debe tener 1 registro.");
    }
    if (countRows("MENSAJE") !== 1) {
      throw new Error("MENSAJE debe tener 1 registro.");
    }

    const participacion = db
      .prepare(
        'SELECT email, codigo_entrenamiento FROM "USUARIO_ENTRENAMIENTO" LIMIT 1'
      )
      .get() as { email: string; codigo_entrenamiento: number };

    if (participacion.email !== "local@runconnect.test") {
      throw new Error("El organizador debe quedar en USUARIO_ENTRENAMIENTO.");
    }
    if (participacion.codigo_entrenamiento !== entrenamiento.codigoEntrenamiento) {
      throw new Error("USUARIO_ENTRENAMIENTO debe vincularse al entrenamiento creado.");
    }

    const mensaje = db
      .prepare('SELECT contenido FROM "MENSAJE" LIMIT 1')
      .get() as { contenido: string };

    if (mensaje.contenido !== welcomeMessage) {
      throw new Error("MENSAJE debe contener el texto de bienvenida.");
    }
  });

  await test("Atomicity: rollback when USUARIO_ENTRENAMIENTO fails", async () => {
    // QA: Atomicidad y consistencia transaccional.
    resetDatabase();

    db.exec('DROP TABLE IF EXISTS "USUARIO_ENTRENAMIENTO"');

    const now = new Date();
    const startIso = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
    const endIso = new Date(new Date(startIso).getTime() + 2 * 60 * 60 * 1000).toISOString();

    let didThrow = false;
    try {
      await crearEntrenamientoConChat("local@runconnect.test", {
        codigoDeporte: "RUN",
        fechaInicio: startIso,
        fechaFin: endIso,
        puntoEncuentro: "POINT(-58.3816 -34.6037)",
        distanciaEstimada: 5.0,
        ritmoObjetivo: "5:30/km",
        nivel: "intermedio",
        cupoMaximo: 20,
      });
    } catch {
      didThrow = true;
    }

    if (!didThrow) {
      throw new Error("Se esperaba un error al insertar USUARIO_ENTRENAMIENTO.");
    }

    if (countRows("ENTRENAMIENTO") !== 0) {
      throw new Error("ENTRENAMIENTO no debe persistir tras rollback.");
    }
  });

  await test("Business rule: fechaInicio >= now + 30 min", async () => {
    // QA: Reglas de negocio (validacion temporal).
    resetDatabase();

    const now = new Date();
    const tooSoonIso = new Date(now.getTime() + 10 * 60 * 1000).toISOString();
    const endIso = new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString();

    let error: unknown;
    try {
      await crearEntrenamientoConChat("local@runconnect.test", {
        codigoDeporte: "RUN",
        fechaInicio: tooSoonIso,
        fechaFin: endIso,
        puntoEncuentro: "POINT(-58.3816 -34.6037)",
        distanciaEstimada: 5.0,
        ritmoObjetivo: "5:30/km",
        nivel: "intermedio",
        cupoMaximo: 20,
      });
    } catch (err) {
      error = err;
    }

    if (!(error instanceof EntrenamientoValidationError)) {
      throw new Error("Se esperaba EntrenamientoValidationError.");
    }
    if (countRows("ENTRENAMIENTO") !== 0) {
      throw new Error("ENTRENAMIENTO no debe persistir si la validacion falla.");
    }
  });

  await test("Business rule: fechaFin posterior a fechaInicio", async () => {
    // QA: Reglas de negocio (consistencia temporal).
    resetDatabase();

    const now = new Date();
    const startIso = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
    const endIso = new Date(new Date(startIso).getTime() - 10 * 60 * 1000).toISOString();

    let error: unknown;
    try {
      await crearEntrenamientoConChat("local@runconnect.test", {
        codigoDeporte: "RUN",
        fechaInicio: startIso,
        fechaFin: endIso,
        puntoEncuentro: "POINT(-58.3816 -34.6037)",
        distanciaEstimada: 5.0,
        ritmoObjetivo: "5:30/km",
        nivel: "intermedio",
        cupoMaximo: 20,
      });
    } catch (err) {
      error = err;
    }

    if (!(error instanceof EntrenamientoValidationError)) {
      throw new Error("Se esperaba EntrenamientoValidationError.");
    }
    if (countRows("ENTRENAMIENTO") !== 0) {
      throw new Error("ENTRENAMIENTO no debe persistir si la validacion falla.");
    }
  });

  console.log(`\n${"=".repeat(50)}\n`);
  const passed = results.filter((r) => r.passed).length;
  const total = results.length;
  console.log(`Tests passed: ${passed}/${total}\n`);

  if (passed === total) {
    console.log("✓ All tests passed!");
    process.exit(0);
  } else {
    console.log("✗ Some tests failed:");
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.log(`  - ${r.name}: ${r.error}`);
      });
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Test runner error:", error);
  process.exit(1);
});
