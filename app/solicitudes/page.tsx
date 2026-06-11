import { headers } from "next/headers";
import { redirect } from "next/navigation";

import Navbar from "../components/Navbar";

import { getAuth } from "@/lib/auth";
import { getSolicitudesPendientesDelOrganizador } from "@/services/solicitudService";

import SolicitudCard from "../components/Solicitudes/SolicitudCard";

export default async function SolicitudesPage() {
  const auth = getAuth();

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.email) {
    redirect("/login");
  }

  const solicitudes =
    await getSolicitudesPendientesDelOrganizador(
      session.user.email
    );

  return (
    <div className="rc-root">
      <Navbar />

      <div className="solicitudes-page">
        <div className="solicitudes-header">
          <h1 className="solicitudes-title">
            Gestionar solicitudes
          </h1>

          <p className="solicitudes-subtitle">
            Aceptá o rechazá las solicitudes de participación
            en tus entrenamientos.
          </p>
        </div>

        {solicitudes.length === 0 ? (
          <div className="solicitudes-vacio">
            <div className="solicitudes-vacio-icono">
              📭
            </div>

            <h2>
              No tenés solicitudes pendientes
            </h2>

            <p>
              Cuando alguien solicite participar en uno
              de tus entrenamientos aparecerá acá.
            </p>
          </div>
        ) : (
          <div className="solicitudes-lista">
            {solicitudes.map((s) => (
              <SolicitudCard
                key={s.codigoSolicitud}
                solicitud={s}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}