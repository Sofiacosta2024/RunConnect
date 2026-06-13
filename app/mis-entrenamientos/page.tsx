import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Navbar from "../components/Navbar";
import { getAuth } from "@/lib/auth";
import { getMisEntrenamientos } from "@/services/entrenamientoService";
import Pagination from "../components/Pagination";
import EntrenamientoCard from "../components/Entrenamientos/EntrenamientoCard";

export default async function MisEntrenamientosPage(props: { searchParams: Promise<{ pagina?: string }> }) {
  const auth = getAuth();

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.email) {
    redirect("/login");
  }

  const { pagina: rawPagina } = await props.searchParams;
  const pagina = Math.max(1, Number(rawPagina) || 1);

  const { organizados, participando, totalOrganizados, totalParticipando, totalPaginas } = await getMisEntrenamientos(
    session.user.email,
    pagina
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
          {totalOrganizados + totalParticipando} entrenamiento{(totalOrganizados + totalParticipando) !== 1 ? "s" : ""} en total.
        </p>
      </div>

      <div className="entrenamientos-lista">

          <h2 className="mis-entrenamientos-section">
            🏅 Entrenamientos que organizo {totalOrganizados > 0 && <span style={{ color: "var(--rc-muted)", fontSize: 14, fontWeight: 400 }}>({totalOrganizados})</span>}
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
            🙋 Entrenamientos donde participo {totalParticipando > 0 && <span style={{ color: "var(--rc-muted)", fontSize: 14, fontWeight: 400 }}>({totalParticipando})</span>}
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
                esParticipante={true}
              />
            ))
          )}

          <Pagination pagina={pagina} totalPaginas={totalPaginas} />
        </div>
    </div>
  </div>
);
}