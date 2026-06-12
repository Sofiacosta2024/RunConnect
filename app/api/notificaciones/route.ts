import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import {
  getNotificaciones,
  contarNotificacionesNoLeidas,
  marcarTodasLeidas,
} from "@/services/notificacionService";

export async function GET() {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.email) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const [notificaciones, noLeidas] = await Promise.all([
    getNotificaciones(session.user.email),
    contarNotificacionesNoLeidas(session.user.email),
  ]);

  return NextResponse.json({ notificaciones, noLeidas });
}

export async function PATCH() {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.email) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  await marcarTodasLeidas(session.user.email);
  return NextResponse.json({ ok: true });
}
