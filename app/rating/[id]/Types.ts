import type { getParticipantes, getCalificacionesEmitidas } from "./actions";
 
export type Participante = Awaited<ReturnType<typeof getParticipantes>>[number];
export type CalificacionEmitida = Awaited<ReturnType<typeof getCalificacionesEmitidas>>[number];
 
