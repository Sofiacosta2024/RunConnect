import "server-only";

import * as pg from "./solicitudService.pg";
import * as sqlite from "./solicitudService.sqlite";

const service =
  process.env.DB_CLIENT === "sqlite"
    ? sqlite
    : pg;

export const crearSolicitud =
  service.crearSolicitud;

export const obtenerSolicitudes =
  service.obtenerSolicitudes;

export const aceptarSolicitud =
  service.aceptarSolicitud;

export const rechazarSolicitud =
  service.rechazarSolicitud;

export const getSolicitudesPendientesDelOrganizador =
  (email: string, pagina?: number, limite?: number) =>
    service.getSolicitudesPendientesDelOrganizador(email, pagina, limite);

export const rechazarSolicitudesExpiradas =
  service.rechazarSolicitudesExpiradas; 