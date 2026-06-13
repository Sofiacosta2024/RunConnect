import "server-only";

import { desc, eq, and, count } from "drizzle-orm";
import { db } from "@/lib/db";
import { notificacion } from "@/db/schema";

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
  email: string,
  tipo: string,
  mensaje: string,
  codigoEntrenamiento?: number | null
) {
  const condiciones = [
  eq(notificacion.email, email),
  eq(notificacion.tipo, tipo),
  eq(notificacion.mensaje, mensaje),
];

if (codigoEntrenamiento !== undefined && codigoEntrenamiento !== null) {
  condiciones.push(
    eq(notificacion.codigoEntrenamiento, codigoEntrenamiento)
  );
}

const existente = await db
  .select({
    codigoNotificacion: notificacion.codigoNotificacion,
  })
  .from(notificacion)
  .where(and(...condiciones))
  .limit(1);

  if (existente.length > 0) {
    return existente[0];
  }

  const [nueva] = await db
    .insert(notificacion)
    .values({
      email,
      tipo,
      mensaje,
      codigoEntrenamiento: codigoEntrenamiento ?? null,
      leida: 0,
    })
    .returning();

  return nueva;
}
export async function getNotificaciones(email: string, pagina?: number, limite: number = 20) {
  const offset = pagina ? (pagina - 1) * limite : undefined;

  const countResult = await db
    .select({ total: count() })
    .from(notificacion)
    .where(eq(notificacion.email, email));

  const total = Number(countResult[0]?.total ?? 0);

  let query = db
    .select()
    .from(notificacion)
    .where(eq(notificacion.email, email))
    .orderBy(desc(notificacion.creadoEn));

  const rows = pagina !== undefined
    ? await (query as any).limit(limite).offset(offset!)
    : await query;

  return {
    data: rows,
    total,
    pagina: pagina ?? 1,
    totalPaginas: Math.ceil(total / (pagina !== undefined ? limite : Math.max(total, 1))),
  };
}

export async function getNotificacionesNoLeidas(email: string) {
  const rows = await db
    .select()
    .from(notificacion)
    .where(
      and(eq(notificacion.email, email), eq(notificacion.leida, 0))
    )
    .orderBy(desc(notificacion.creadoEn))
    .limit(50);
  return rows;
}

export async function contarNotificacionesNoLeidas(email: string) {
  const rows = await db
    .select({ total: count() })
    .from(notificacion)
    .where(
      and(eq(notificacion.email, email), eq(notificacion.leida, 0))
    );
  return Number(rows[0]?.total ?? 0);
}

export async function marcarNotificacionLeida(
  codigoNotificacion: number,
  email: string
) {
  await db
    .update(notificacion)
    .set({ leida: 1 })
    .where(
      and(
        eq(notificacion.codigoNotificacion, codigoNotificacion),
        eq(notificacion.email, email)
      )
    );
}

export async function marcarTodasLeidas(email: string) {
  await db
    .update(notificacion)
    .set({ leida: 1 })
    .where(eq(notificacion.email, email));
}
