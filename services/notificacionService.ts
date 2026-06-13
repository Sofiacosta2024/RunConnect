import "server-only";

import type * as pg from "./notificacionService.pg";

const isSqlite = process.env.DB_CLIENT === "sqlite" || process.env.DB_MODE === "sqlite";

async function getService(): Promise<typeof pg> {
  if (isSqlite) {
    return import("./notificacionService.sqlite");
  }
  return import("./notificacionService.pg");
}

export async function crearNotificacion(
  email: string,
  tipo: string,
  mensaje: string,
  codigoEntrenamiento?: number | null
) {
  const service = await getService();
  return service.crearNotificacion(email, tipo, mensaje, codigoEntrenamiento);
}

export async function getNotificaciones(email: string, pagina?: number, limite?: number) {
  const service = await getService();
  return service.getNotificaciones(email, pagina, limite);
}

export async function getNotificacionesNoLeidas(email: string) {
  const service = await getService();
  return service.getNotificacionesNoLeidas(email);
}

export async function contarNotificacionesNoLeidas(email: string) {
  const service = await getService();
  return service.contarNotificacionesNoLeidas(email);
}

export async function marcarNotificacionLeida(
  codigoNotificacion: number,
  email: string
) {
  const service = await getService();
  return service.marcarNotificacionLeida(codigoNotificacion, email);
}

export async function marcarTodasLeidas(email: string) {
  const service = await getService();
  return service.marcarTodasLeidas(email);
}
