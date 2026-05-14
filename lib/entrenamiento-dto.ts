export type PuntoEncuentroInput =
  | string
  | {
      latitude?: number;
      longitude?: number;
      lat?: number;
      lng?: number;
    };

export type EntrenamientoCreateDto = {
  codigoDeporte: string;
  fechaInicio: string;
  fechaFin: string;
  fechaLimiteInscripcion?: string | null;
  estado: "abierto" | "cerrado" | "cancelado" | "finalizado";
  puntoEncuentro: PuntoEncuentroInput;
  distanciaEstimada?: number | null;
  ritmoObjetivo?: string | null;
  codigoNivel: string;
  cupoMaximo?: number | null;
};
