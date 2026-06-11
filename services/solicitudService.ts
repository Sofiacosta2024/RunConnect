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
  service.getSolicitudesPendientesDelOrganizador;

export const rechazarSolicitudesExpiradas =
  service.rechazarSolicitudesExpiradas; 