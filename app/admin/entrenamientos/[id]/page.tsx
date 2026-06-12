import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { getById } from "@/services/entrenamientoService";
import AdminEditForm from "./AdminEditForm";

export const dynamic = "force-dynamic";

export default async function AdminEditarEntrenamientoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getAdminSession(await headers());
  if (!session) redirect("/login");

  const { id } = await params;
  const codigo = Number(id);
  if (isNaN(codigo)) redirect("/admin/entrenamientos");

  const entrenamiento = await getById(codigo);
  if (!entrenamiento) notFound();

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, letterSpacing: "2px", marginBottom: 8 }}>
          Editar entrenamiento #{codigo}
        </h1>
        <p style={{ color: "var(--rc-muted)", fontSize: 15 }}>
          Modificá los campos que quieras actualizar.
        </p>
      </div>

      <AdminEditForm entrenamiento={entrenamiento} />
    </div>
  );
}
