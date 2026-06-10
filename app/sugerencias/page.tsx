import { getPerfilUsuario, getSugerencias } from "./actions";
import SugerenciasClient from "./SugerenciasClient";

export const dynamic = "force-dynamic";

const NIVEL_DEFAULT = "intermedio";
const DISTANCIA_KM = 10;

export default async function SugerenciasPage() {
  const perfil = await getPerfilUsuario();

  const sugerenciasIniciales =
    perfil?.codigoDeporte && perfil?.ubicacion
      ? await getSugerencias({ nivel: NIVEL_DEFAULT, distanciaMaxKm: DISTANCIA_KM }).catch(() => [])
      : [];

  return (
    <SugerenciasClient
      perfil={perfil}
      sugerenciasIniciales={sugerenciasIniciales}
      nivelDefault={NIVEL_DEFAULT}
    />
  );
}