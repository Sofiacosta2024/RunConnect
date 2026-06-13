import "server-only";

export type NotificacionRow = {
  codigoNotificacion: number;
  email: string;
  tipo: string;
  mensaje: string;
  codigoEntrenamiento: number | null;
  leida: number;
  creadoEn: Date;
};

export async function crearNotificacion(
  _email: string,
  _tipo: string,
  _mensaje: string,
  _codigoEntrenamiento?: number | null
): Promise<NotificacionRow> {
  throw new Error("Not implemented for SQLite");
}

export async function getNotificaciones(_email: string, _pagina?: number, _limite?: number): Promise<{ data: NotificacionRow[]; total: number; pagina: number; totalPaginas: number }> {
  throw new Error("Not implemented for SQLite");
}

export async function getNotificacionesNoLeidas(_email: string): Promise<NotificacionRow[]> {
  throw new Error("Not implemented for SQLite");
}

export async function contarNotificacionesNoLeidas(_email: string): Promise<number> {
  return 0;
}

export async function marcarNotificacionLeida(
  _codigoNotificacion: number,
  _email: string
): Promise<void> {
  throw new Error("Not implemented for SQLite");
}

export async function marcarTodasLeidas(_email: string): Promise<void> {
  throw new Error("Not implemented for SQLite");
}
