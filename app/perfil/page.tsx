import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { calificacion, usuario, usuarioEntrenamiento } from "@/db/schema";
import { avg, count, eq } from "drizzle-orm";
import PerfilClient from "./PerfilClient";

export const dynamic = "force-dynamic";

export default async function PerfilPage() {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.email) redirect("/login");

  const email = session.user.email;

  const [perfil] = await db
    .select({
      email: usuario.email,
      nombre: usuario.nombre,
      fotoPerfil: usuario.fotoPerfil,
      codigoDeporte: usuario.codigoDeporte,
      ubicacion: usuario.ubicacion,
    })
    .from(usuario)
    .where(eq(usuario.email, email))
    .limit(1);

  if (!perfil) redirect("/login");

  const [stats] = await db
    .select({
      promedio: avg(calificacion.puntaje),
      cantidad: count(calificacion.puntaje),
    })
    .from(calificacion)
    .where(eq(calificacion.emailCalificado, email));

  const participaciones = await db
    .select({ rol: usuarioEntrenamiento.rol })
    .from(usuarioEntrenamiento)
    .where(eq(usuarioEntrenamiento.email, email));

  const perfilData = {
    email: perfil.email,
    fullName: perfil.nombre,
    profilePicture: perfil.fotoPerfil,
    preferredSport: perfil.codigoDeporte,
    averageRating: stats.promedio
      ? Math.round(Number(stats.promedio) * 10) / 10
      : null,
    ratingsCount: Number(stats.cantidad),
    trainingsOrganized: participaciones.filter((p) => p.rol === "organizador").length,
    trainingsParticipated: participaciones.filter((p) => p.rol === "participante").length,
    ubicacionDisplay: perfil.ubicacion?.includes("|")
    ? perfil.ubicacion.split("|")[1]
    : perfil.ubicacion ?? null,
  };

  return <PerfilClient perfil={perfilData} email={email} />;
}