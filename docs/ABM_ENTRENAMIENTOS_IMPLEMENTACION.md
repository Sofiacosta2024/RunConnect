# ABM entrenamientos - implementacion y limpieza

Este documento explica los cambios realizados, como se implementaron y por que. El objetivo fue permitir pruebas locales sin Neon/PostGIS y dejar el camino de Postgres intacto para produccion.

## Cambios realizados (resumen)

- Se agrego un modo local con SQLite para pruebas rapidas.
- Se separo el servicio de entrenamientos en Postgres y SQLite.
- Se creo un selector que elige el servicio segun `DB_MODE`.
- Se agrego un bypass de auth local para organizar pruebas con `x-organizer-id` o `LOCAL_ORGANIZER_ID`.
- Se ajusto el script de smoke test para usar el id creado y evitar 404 en PUT/DELETE.

## Archivos modificados o nuevos

- `package.json`
  - Se agrego `better-sqlite3` y `@types/better-sqlite3` para el modo local.

- `lib/sqlite.ts` (nuevo)
  - Helper para abrir SQLite con `SQLITE_DB_PATH` y habilitar `foreign_keys`.

- `scripts/init-sqlite.mjs` (nuevo)
  - Crea el archivo SQLite, DDL minimo y seeds (RUN, INTERMEDIO, usuario/organizador, 1 entrenamiento).

- `services/entrenamientoService.pg.ts` (nuevo)
  - Contiene la logica original de Postgres, sin cambios funcionales.

- `services/entrenamientoService.sqlite.ts` (nuevo)
  - Implementacion SQLite del ABM sin PostGIS. Guarda `punto_de_encuentro` como WKT en texto.

- `services/entrenamientoService.ts`
  - Ahora es un selector: si `DB_MODE=sqlite` usa SQLite, si no usa Postgres.

- `lib/organizer-auth.ts`
  - En modo SQLite, lee `x-organizer-id` o `LOCAL_ORGANIZER_ID` y valida entero positivo.
  - En modo Postgres mantiene el flujo original (session + pool).

- `scripts/test-entrenamientos.mjs`
  - Usa el id devuelto por el POST para PUT/DELETE. Evita ids fijos obsoletos.

## Como funciona el modo local

- Activacion:
  - `DB_MODE=sqlite`
  - `SQLITE_DB_PATH` (opcional, default `runconnect.sqlite` en el root)
  - `LOCAL_ORGANIZER_ID` (ej: `1`) o header `x-organizer-id`

- Flujo:
  - El selector en `services/entrenamientoService.ts` carga SQLite.
  - `lib/organizer-auth.ts` evita sesiones y usa id local.
  - Se usa WKT plano en `punto_de_encuentro` (sin PostGIS).

## Comandos para pruebas locales

```powershell
npm install
node scripts/init-sqlite.mjs
$env:DB_MODE="sqlite"
$env:LOCAL_ORGANIZER_ID="1"
# optional: $env:SQLITE_DB_PATH="C:\Users\Usuario\Downloads\ProyectosGit\RunConnect\runconnect.sqlite"
npm run dev
node scripts/test-entrenamientos.mjs
```

## Preparado para Neon/Postgres

- El modo Postgres sigue siendo el default (cuando `DB_MODE` no es `sqlite`).
- `lib/db.ts` sigue usando `DATABASE_URL` y la logica de PostGIS se mantiene en `services/entrenamientoService.pg.ts`.
- El selector solo redirige al servicio SQLite si se activa el modo local.

## Verificacion cuando Neon este listo

1. Asegurar que Neon tiene tablas y PostGIS (verificar con `scripts/test-db.cjs`).
2. Quitar `DB_MODE=sqlite` del entorno.
3. Iniciar `npm run dev` y ejecutar:

```powershell
$env:BASE_URL="http://localhost:3000"
node scripts/test-entrenamientos.mjs
```

Si las tablas/extension existen, el ABM deberia funcionar igual que en local.


