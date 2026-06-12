import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth";
import { getPerfilPropio } from "./actions";
import PerfilClient from "./PerfilClient";

export const dynamic = "force-dynamic";

export default async function PerfilPage() {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.email) redirect("/login");

  const perfil = await getPerfilPropio();

  return <PerfilClient perfil={perfil} />;
}