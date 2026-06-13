import { headers } from "next/headers";
import { redirect } from "next/navigation";

import Navbar from "../components/Navbar";
import SolicitudCard from "../components/Solicitudes/SolicitudCard";
import Pagination from "../components/Pagination";

import { getAuth } from "@/lib/auth";
import { getSolicitudesPendientesDelOrganizador } from "@/services/solicitudService";
import { db } from "@/lib/db";
import { entrenamiento, usuarioEntrenamiento } from "@/db/schema";
import { inArray } from "drizzle-orm";
import { eq, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

const LIMITE = 10;

type SolicitudRow = {
  codigoSolicitud: number;
  estado: string;
  fecha: Date;
  emailSolicitante: string;
  nombreSolicitante: string;
  codigoEntrenamiento: number;
  deporte: string;
  fechaInicio: Date;
  nivel: string;
  cupo: number | null;
};

export default async function SolicitudesPage(props: { searchParams: Promise<{ pagina?: string }> }) {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.email) redirect("/login");

  const { pagina: rawPagina } = await props.searchParams;
  const pagina = Math.max(1, Number(rawPagina) || 1);

  const result = await getSolicitudesPendientesDelOrganizador(
    session.user.email,
    pagina,
    LIMITE
  );

  const solicitudes: SolicitudRow[] = (result as any).data ?? [];
  const total: number = (result as any).total ?? 0;
  const totalPaginas: number = (result as any).totalPaginas ?? 1;

  const codigosEntrenamiento: number[] = [...new Set(solicitudes.map((s) => s.codigoEntrenamiento))];


const [entrenamientos, participantes] = codigosEntrenamiento.length > 0
  ? await Promise.all([
      db
        .select({ codigoEntrenamiento: entrenamiento.codigoEntrenamiento, cupoMaximo: entrenamiento.cupoMaximo })
        .from(entrenamiento)
        .where(inArray(entrenamiento.codigoEntrenamiento, codigosEntrenamiento)),

      db
        .select({ codigoEntrenamiento: usuarioEntrenamiento.codigoEntrenamiento })
        .from(usuarioEntrenamiento)
        .where(
          and(
            inArray(usuarioEntrenamiento.codigoEntrenamiento, codigosEntrenamiento),
            eq(usuarioEntrenamiento.rol, "participante")
          )
        ),
    ])
  : [[], []];
  // logs
console.log("Datos de entrenamiento:", entrenamientos);
console.log("Participantes encontrados en BD:", participantes);

const cupoMap = Object.fromEntries(
  entrenamientos.map((e) => {
    const ocupados = participantes.filter((p) => p.codigoEntrenamiento === e.codigoEntrenamiento).length;
    console.log(`Entrenamiento ${e.codigoEntrenamiento}: Máximo ${e.cupoMaximo}, Ocupados ${ocupados}`);
    return [
      e.codigoEntrenamiento,
      { cupoMaximo: e.cupoMaximo, cupoOcupado: ocupados }
    ];
  })
);

  return (
    <div className="rc-root">
      <Navbar />

      <div style={{ maxWidth: 600, margin: "0 auto", padding: "2rem 1rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>

        {/* Header */}
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>
            Gestionar solicitudes
          </h1>
          <p style={{ color: "var(--rc-muted)", fontSize: "0.9rem", marginTop: "0.3rem" }}>
            Aceptá o rechazá las solicitudes de participación en tus entrenamientos.
            {total > 0 && <> · {total} pendiente{total !== 1 ? "s" : ""}</>}
          </p>
        </div>

        {/* Contenido */}
        {solicitudes.length === 0 ? (
          <div
            className="rc-card"
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem", padding: "3rem 1rem", textAlign: "center" }}
          >
            <span style={{ fontSize: "2.5rem" }}>📭</span>
            <h2 style={{ fontSize: "1rem", fontWeight: 600, margin: 0 }}>No tenés solicitudes pendientes</h2>
            <p style={{ color: "var(--rc-muted)", fontSize: "0.85rem", margin: 0 }}>
              Cuando alguien solicite participar en uno de tus entrenamientos aparecerá acá.
            </p>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {solicitudes.map((s) => (
                <SolicitudCard
                  key={s.codigoSolicitud}
                  solicitud={{
                    ...s,
                    cupoMaximo: cupoMap[s.codigoEntrenamiento]?.cupoMaximo ?? null,
                    cupoOcupado: cupoMap[s.codigoEntrenamiento]?.cupoOcupado ?? 0,
                  }}
                />
              ))}
            </div>
            <Pagination pagina={pagina} totalPaginas={totalPaginas} />
          </>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}