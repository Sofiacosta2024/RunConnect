# ABM entrenamientos - implementacion y limpieza

Este documento explica los cambios realizados, como se implementaron y por que. El objetivo fue permitir pruebas locales sin Neon/PostGIS y dejar el camino de Postgres intacto para produccion.

## Cambios realizados (resumen)

- Se agrego un modo local con SQLite para pruebas rapidas.
- Se separo el servicio de entrenamientos en Postgres y SQLite.
- Se creo un selector que elige el servicio segun `DB_MODE`.
- Se agrego un bypass de auth local para organizar pruebas con `x-organizer-id` o `LOCAL_ORGANIZER_ID`.
- Se ajusto el script de smoke test para usar el id creado y evitar 404 en PUT/DELETE.
- Se agrego validacion temporal para fechas de entrenamientos (UTC).
- Se centralizo la validacion temporal en la funcion pura `validarFechasEntrenamiento`.
- Se refactorizo el modelo de entrenamiento con timestamps y estado.
- Se definio el DTO de entrada para entrenamientos y un error dedicado de validacion.
- Se implemento la creacion atomica de entrenamiento + chat (RN-03).
IMPORTANTE: Estado en la tabla de entrenamiento, atributo no considerado en el modelo inicial, es de suma importancia, dado que sin este, no podríamos persistir la cancelación de un entrenamiento por parte del organizador. Además, este permite la finalización manual del entrenamiento: puede suceder que termine antes de lo previsto (datos cargados en el sistema), por lo que esta finalización manual activaría automáticamente las Calificaciones.
A su vez, actúa como semáforo en las demás operaciones del sistema:
- Con la tabla PARTICIPACIÓN: Solo se pueden insertar registros en PARTICIPACION si el entrenamiento tiene estado = 'abierto'.
- Con la tabla MENSAJE: Podríamos definir que si el entrenamiento cambia a estado = 'finalizado', el chat se vuelve de "solo lectura" después de 24 horas.
-Con la tabla CALIFICACIÓN: No se debería poder insertar una fila en CALIFICACION si el entrenamiento no está en estado = "finalizado".


## Archivos modificados o nuevos

- `package.json`
  - Se agrego `better-sqlite3` y `@types/better-sqlite3` para el modo local.

- `lib/sqlite.ts` (nuevo)
  - Helper para abrir SQLite con `SQLITE_DB_PATH` y habilitar `foreign_keys`.

- `scripts/init-sqlite.mjs` (nuevo)
  - Crea el archivo SQLite, DDL minimo y seeds (RUN, INTERMEDIO, usuario/organizador, 1 entrenamiento).
  - Agrega tablas locales `PARTICIPACION` y `MENSAJE` para RN-03.

- `services/entrenamientoService.pg.ts` (nuevo)
  - Contiene la logica original de Postgres, sin cambios funcionales.
  - Incluye `crearEntrenamientoConChat` con transaccion y alta de chat.

- `services/entrenamientoService.sqlite.ts` (nuevo)
  - Implementacion SQLite del ABM sin PostGIS. Guarda `punto_de_encuentro` como WKT en texto.
  - Incluye `crearEntrenamientoConChat` para pruebas locales.

- `services/entrenamientoService.ts`
  - Ahora es un selector: si `DB_MODE=sqlite` usa SQLite, si no usa Postgres.
  - Expone `crearEntrenamientoConChat`.

- `lib/organizer-auth.ts`
  - En modo SQLite, lee `x-organizer-id` o `LOCAL_ORGANIZER_ID` y valida entero positivo.
  - En modo Postgres mantiene el flujo original (session + pool).

- `scripts/test-entrenamientos.mjs`
  - Usa el id devuelto por el POST para PUT/DELETE. Evita ids fijos obsoletos.
  - Incluye casos de validacion temporal (fechas invalidas).

## Validacion temporal (UTC)

Reglas aplicadas en la capa de servicio (Postgres y SQLite):

- `fecha_inicio` debe ser al menos 30 minutos posterior a la fecha y hora actual.
- `fecha_fin` debe ser estrictamente posterior a `fecha_inicio`.
- Duracion entre 15 minutos y 6 horas entre `fecha_inicio` y `fecha_fin`.
- Si existe `fecha_limite_inscripcion`, debe ser > ahora y <= `fecha_inicio`.

Interpretacion de zonas horarias:

- Si el valor no trae zona horaria, se asume UTC.
- Se recomienda enviar ISO 8601 con offset (ej: `2026-05-10T18:30:00-03:00`).

## Formato de request (frontend)

### Endpoints relevantes

- `POST /api/entrenamientos`
  - Crea el entrenamiento y el chat de forma atomica (RN-03).
  - Responde `201` con el objeto del entrenamiento creado.
- `GET /api/entrenamientos`
  - Lista entrenamientos.
- `GET /api/entrenamientos/:id`
  - Devuelve un entrenamiento por id.

### Autenticacion requerida

- El id del organizador se toma del contexto de autenticacion (header/cookie), no del JSON.
- En modo local (SQLite): usar header `x-organizer-id` o `LOCAL_ORGANIZER_ID` en entorno.

Se acepta un unico formato temporal:

- `fecha_inicio` (ISO 8601, con timezone o UTC)
- `fecha_fin` (ISO 8601, con timezone o UTC)

Campos aceptados (snake o camel case):

- `fecha_inicio` / `fechaInicio` (obligatoria)
- `fecha_fin` / `fechaFin` (obligatoria)
- `fecha_limite_inscripcion` / `fechaLimiteInscripcion` (opcional)
- `estado` (obligatorio: abierto, cerrado, cancelado, finalizado)

Ejemplo de POST:

```json
{
  "codigoDeporte": "RUN",
  "fecha_inicio": "2026-05-10T18:30:00-03:00",
  "fecha_fin": "2026-05-10T20:30:00-03:00",
  "fecha_limite_inscripcion": "2026-05-10T16:00:00Z",
  "ubicacion": "POINT(-58.3816 -34.6037)",
  "codigoNivel": "INTERMEDIO",
  "cupoMaximo": 20,
  "estado": "abierto"
}
```

Nota: `fecha_inicio`, `fecha_fin`, `fecha_limite_inscripcion` y `estado` ya forman parte del esquema.
Nota: Para creacion, el `estado` debe ser `abierto`.

### Ubicacion / punto de encuentro

- Se acepta `ubicacion`, `puntoEncuentro` o `punto_de_encuentro`.
- Formato recomendado: WKT `POINT(longitud latitud)`.
- Alternativa: objeto `{ lat, lng }` o `{ latitude, longitude }`.

### Respuesta esperada (creacion)

`201 Created` con el entrenamiento creado. Ejemplo (campos clave):

```json
{
  "ok": true,
  "data": {
    "codigoEntrenamiento": 123,
    "idOrganizador": 1,
    "codigoDeporte": "RUN",
    "fechaInicio": "2026-05-10T21:30:00.000Z",
    "fechaFin": "2026-05-10T23:30:00.000Z",
    "fechaLimiteInscripcion": "2026-05-10T19:00:00.000Z",
    "estado": "abierto",
    "ubicacion": "POINT(-58.3816 -34.6037)",
    "codigoNivel": "INTERMEDIO",
    "cupoMaximo": 20
  }
}
```

## DTO y manejo de errores

Se agrego un DTO tipado para la creacion de entrenamientos:

```ts
import type { EntrenamientoCreateDto } from "@/lib/entrenamiento-dto";

const dto: EntrenamientoCreateDto = {
  codigoDeporte: "RUN",
  fechaInicio: "2026-05-10T18:30:00-03:00",
  fechaFin: "2026-05-10T20:30:00-03:00",
  fechaLimiteInscripcion: "2026-05-10T16:00:00Z",
  estado: "abierto",
  puntoEncuentro: "POINT(-58.3816 -34.6037)",
  distanciaEstimada: 5.0,
  ritmoObjetivo: "5:30/km",
  codigoNivel: "INTERMEDIO",
  cupoMaximo: 20,
};
```

El `id_organizador` no forma parte del DTO porque se obtiene desde el contexto de autenticacion (`getAuthenticatedOrganizerId`) y se pasa como argumento separado al servicio.

Para errores de validacion en entrenamientos se utiliza la clase `EntrenamientoValidationError`, que integra el mismo formato de respuesta que el resto de `ApiError` y permite personalizar el status (default 400).

## RN-03: instanciacion automatica del chat

Al crear un entrenamiento se ejecuta `crearEntrenamientoConChat`, que usa una transaccion para asegurar atomicidad:

1. Valida fechas (y otros campos) antes de insertar.
2. Inserta `ENTRENAMIENTO` con `estado = 'abierto'`.
3. Inserta al organizador en `PARTICIPACION`.
4. Inserta un mensaje inicial en `MENSAJE` (contenido de sistema).

Si falla cualquiera de los pasos 3 o 4, se revierte la transaccion y el entrenamiento no queda creado sin su organizador como participante.

## Tests de integracion RN-03

Se agrego una suite de pruebas en `__tests__/entrenamientoService.test.ts` que valida atributos de calidad clave:

- **Consistencia end-to-end:** en el camino feliz se crean `ENTRENAMIENTO`, `PARTICIPACION` y `MENSAJE` y se retorna el entrenamiento creado.
- **Atomicidad:** si falla la insercion en `PARTICIPACION`, se revierte la transaccion y no persiste `ENTRENAMIENTO`.
- **Reglas de negocio:** fechas invalidas disparan `EntrenamientoValidationError` y no se insertan registros.
- **Consistencia de estado:** el entrenamiento creado queda con `estado = 'abierto'`.

Estas pruebas usan SQLite en memoria y limpian tablas antes de cada caso para asegurar aislamiento.

## Validacion centralizada en backend

La validacion temporal se concentra en una funcion pura reutilizable:

```ts
import { ValidationError } from "@/lib/api-errors";
import { validarFechasEntrenamiento } from "@/lib/entrenamiento-fechas";

const resultado = validarFechasEntrenamiento({
  fechaInicio: String(body.fecha_inicio ?? body.fechaInicio ?? ""),
  fechaFin: String(body.fecha_fin ?? body.fechaFin ?? ""),
  fechaLimiteInscripcion: body.fecha_limite_inscripcion ?? body.fechaLimiteInscripcion ?? null,
  now: new Date(),
});

if (!resultado.valido) {
  throw new ValidationError(resultado.error ?? "Fechas invalidas.");
}
```

Esta funcion se usa en los servicios de entrenamientos antes de insertar o actualizar registros, garantizando respuestas 400 con mensajes claros ante cualquier inconsistencia temporal.

## Respuesta de error (400)

Ejemplo cuando `fecha_inicio` es demasiado cercana:

```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "fecha_inicio debe ser al menos 30 minutos posterior al momento actual.",
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


