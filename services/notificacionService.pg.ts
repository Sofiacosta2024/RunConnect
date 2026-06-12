import "server-only";

import { desc, eq, and, sql, count } from "drizzle-orm";
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

export async function getNotificaciones(email: string) {
  return db
    .select()
    .from(notificacion)
    .where(eq(notificacion.email, email))
    .orderBy(desc(notificacion.creadoEn))
    .limit(50);
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
