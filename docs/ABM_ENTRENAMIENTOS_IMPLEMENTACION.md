# ABM entrenamientos - implementacion y limpieza

Este documento explica los cambios realizados, como se implementaron y por que. El objetivo fue permitir pruebas locales sin Neon/PostGIS y dejar el camino de Postgres intacto para produccion.

## Cambios realizados (resumen)

- Se agrego un modo local con SQLite para pruebas rapidas.
- Se separo el servicio de entrenamientos en Postgres y SQLite.
- Se creo un selector que elige el servicio segun `DB_MODE`.
- Se agrego un bypass de auth local para organizar pruebas con `x-organizer-id` o `LOCAL_ORGANIZER_ID`.
- Se ajusto el script de smoke test para usar el id creado y evitar 404 en PUT/DELETE.
- Se agrego validacion temporal para fechas de entrenamientos (UTC).

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
  - Incluye casos de validacion temporal (fechas invalidas).

## Validacion temporal (UTC)

Reglas aplicadas en la capa de servicio (Postgres y SQLite):

- `fecha_inicio` debe ser posterior a la fecha y hora actual.
- `fecha_fin` debe ser igual o posterior a `fecha_inicio` (si no se envia, se asume igual a inicio).
- Si existe `fecha_limite_inscripcion`, debe ser > ahora y <= `fecha_inicio`.

Interpretacion de zonas horarias:

- Si el valor no trae zona horaria, se asume UTC.
- Se recomienda enviar ISO 8601 con offset (ej: `2026-05-10T18:30:00-03:00`).

## Formato de request (frontend)

Se aceptan dos formas de definir el inicio:

1. `fecha` + `hora` (compatibilidad actual)
2. `fecha_inicio` (ISO 8601)

`fecha_fin` es opcional; si no se envia, se toma igual a `fecha_inicio`.
------------------>REVISAR ESTO DE FECHA FIN: ¿QUE SENTIDO TENDRÍA QUE SEA "OPCIONAL"? <-------------------------------------------------------
¿Hay alguna razón por la que el entrenamiento podria durar más de un dia entre fechas? 
La idea sería que fecha_fin sirva para limpiar los entrenamientos ya concluidos del mapa. Hay alguna razon mas por la que la necesitemos? 
Si no es así, entonces la lógica de fecha_inicio + horario_inicio sirve para limpiarlo del mapa

Campos aceptados (snake o camel case):

- `fecha_inicio` / `fechaInicio` (opcional si se envia `fecha` + `hora`)
- `fecha_fin` / `fechaFin` (obligatoria)(????)
- `fecha_limite_inscripcion` / `fechaLimiteInscripcion` (opcional)

Ejemplo de POST:

```json
{
  "codigoDeporte": "RUN",
  "fecha": "2026-05-10",
  "hora": "18:30:00",
  "fecha_fin": "2026-05-10T20:30:00Z",
  "fecha_limite_inscripcion": "2026-05-10T16:00:00Z",
  "ubicacion": "POINT(-58.3816 -34.6037)",
  "codigoNivel": "INTERMEDIO",
  "cupoMaximo": 20
}
```

Nota: por ahora `fecha_fin` y `fecha_limite_inscripcion` solo se usan para validacion.
No se persisten en la tabla de entrenamientos (aun no hay columnas para eso).

## Respuesta de error (400)

Ejemplo cuando `fecha_fin` es invalida:

```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "fecha_fin debe ser posterior a fecha_inicio.",
    "details": null
  }
}
```

## Como funciona el modo local

- Activacion:
  - `DB_MODE=sqlite`
  - `SQLITE_DB_PATH` (opcional, default `runconnect.sqlite` en el root)
  - `LOCAL_ORGANIZER_ID` (ej: `1`) o header `x-organizer-id`

- Flujo:
  - El selector en `services/entrenamientoService.ts` carga SQLite.
  - `lib/organizer-auth.ts` evita sesiones y usa id local.
  - `proxy.ts` permite acceder a `/api/*` sin sesion cuando `DB_MODE=sqlite`.
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


