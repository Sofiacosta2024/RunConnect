import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import {
  getNotificaciones,
  contarNotificacionesNoLeidas,
  marcarTodasLeidas,
} from "@/services/notificacionService";

export async function GET(request: Request) {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.email) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const rawPagina = searchParams.get("pagina");
  const rawLimite = searchParams.get("limite");
  const pagina = rawPagina ? Math.max(1, Number(rawPagina)) : undefined;
  const limite = rawLimite ? Math.max(1, Number(rawLimite)) : undefined;

  const [result, noLeidas] = await Promise.all([
    getNotificaciones(session.user.email, pagina, limite),
    contarNotificacionesNoLeidas(session.user.email),
  ]);

  return NextResponse.json({ notificaciones: result.data, noLeidas, ...result });
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
