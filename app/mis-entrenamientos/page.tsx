import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Navbar from "../components/Navbar";
import { getAuth } from "@/lib/auth";
import { getMisEntrenamientos } from "@/services/entrenamientoService";

import EntrenamientoCard from "../components/Entrenamientos/EntrenamientoCard";

export default async function MisEntrenamientosPage() {
  const auth = getAuth();

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.email) {
    redirect("/login");
  }

  const entrenamientos = await getMisEntrenamientos(
    session.user.email
  );

return (
  <div className="rc-root">
    <Navbar />
    <div className="entrenamientos-page">
      <div className="entrenamientos-header">
        <h1 className="entrenamientos-title">
          Mis entrenamientos
        </h1>

        <p className="entrenamientos-subtitle">
          Entrenamientos en los que tu solicitud fue aprobada.
        </p>
      </div>

      <div className="entrenamientos-lista">
        {entrenamientos.length === 0 ? (
          <div className="entrenamientos-vacio">
            <div className="entrenamientos-vacio-icono">
              🏃
            </div>

            <p className="entrenamientos-vacio-texto">
              Todavía no tenés entrenamientos aprobados.
            </p>

            <p className="entrenamientos-vacio-sub">
              Cuando un organizador apruebe una solicitud,
              aparecerán en esta sección.
            </p>
          </div>
        ) : (
          entrenamientos.map((e) => (
            <EntrenamientoCard
              key={e.codigoEntrenamiento}
              entrenamiento={e}
            />
          ))
        )}
      </div>
    </div>
  </div>
);
}