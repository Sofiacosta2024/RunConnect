import { getParticipantes, getCalificacionesEmitidas } from "./actions";
import CalificacionClient from "./CalificacionClient";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function CalificacionPage({ params }: Props) {
  const { id } = await params;

  const codigoEntrenamiento = Number(id);

  if (Number.isNaN(codigoEntrenamiento)) {
    throw new Error(`ID de entrenamiento inválido: ${id}`);
  }

  const [participantes, emitidas] = await Promise.all([
    getParticipantes(codigoEntrenamiento),
    getCalificacionesEmitidas(codigoEntrenamiento),
  ]);

  return (
    <CalificacionClient
      codigoEntrenamiento={codigoEntrenamiento}
      participantesIniciales={participantes}
      emitidasIniciales={emitidas}
    />
  );
}