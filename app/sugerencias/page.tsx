import { getPerfilUsuario, getSugerencias } from "./actions";
import SugerenciasClient from "./SugerenciasClient";
 
const NIVEL_DEFAULT = "intermedio";
const DISTANCIA_DEFAULT = 10;
 
export default async function SugerenciasPage() {
  const perfil = await getPerfilUsuario();
 
  // Carga inicial con valores por defecto
  const sugerenciasIniciales = perfil?.codigoDeporte && perfil?.ubicacion
    ? await getSugerencias({ nivel: NIVEL_DEFAULT, distanciaMaxKm: DISTANCIA_DEFAULT }).catch(() => [])
    : [];
 
  return (
    <SugerenciasClient
      perfil={perfil}
      sugerenciasIniciales={sugerenciasIniciales}
      nivelDefault={NIVEL_DEFAULT}
      distanciaDefault={DISTANCIA_DEFAULT}
    />
  );
}
 