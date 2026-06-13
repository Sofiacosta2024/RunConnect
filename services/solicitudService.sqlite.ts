import "server-only";

export async function crearSolicitud(
  email: string,
  codigoEntrenamiento: number
) {
  throw new Error("Not implemented");
}

export async function obtenerSolicitudes(
  emailOrganizador: string,
  codigoEntrenamiento: number,
  estado?: string
) {
  throw new Error("Not implemented");
}

export async function aceptarSolicitud(
  emailOrganizador: string,
  codigoSolicitud: number
) {
  throw new Error("Not implemented");
}

export async function rechazarSolicitud(
  emailOrganizador: string,
  codigoSolicitud: number
) {
  throw new Error("Not implemented");
}

export async function getSolicitudesPendientesDelOrganizador(
  email: string,
  pagina?: number,
  limite?: number
): Promise<never> {
  throw new Error("No implementado para SQLite");
}

export async function rechazarSolicitudesExpiradas() {
  return 0;
}