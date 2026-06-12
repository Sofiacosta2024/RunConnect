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

  const { organizados, participando } = await getMisEntrenamientos(
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

          <h2 className="mis-entrenamientos-section">
            🏅 Entrenamientos que organizo
          </h2>

          {organizados.length === 0 ? (
            <p className="entrenamientos-vacio-sub">
              Todavía no creaste entrenamientos.
            </p>
          ) : (
            organizados.map((e) => (
              <EntrenamientoCard
                key={`org-${e.codigoEntrenamiento}`}
                entrenamiento={e}
                esOrganizador={true}
              />
            ))
          )}

          <h2
            className="mis-entrenamientos-section"
            style={{ marginTop: 40 }}
          >
            🙋 Entrenamientos donde participo
          </h2>

          {participando.length === 0 ? (
            <p className="entrenamientos-vacio-sub">
              No tenés solicitudes aprobadas.
            </p>
          ) : (
            participando.map((e) => (
              <EntrenamientoCard
                key={`part-${e.codigoEntrenamiento}`}
                entrenamiento={e}
              />
            ))
          )}

        </div>
    </div>
  </div>
);
}