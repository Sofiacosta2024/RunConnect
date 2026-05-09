export type { EntrenamientoInput, EntrenamientoListItem } from "./entrenamientoService.pg";

type EntrenamientoService = typeof import("./entrenamientoService.pg");

const isSqliteMode = process.env.DB_MODE === "sqlite";

async function getService(): Promise<EntrenamientoService> {
  if (isSqliteMode) {
    return import("./entrenamientoService.sqlite");
  }

  return import("./entrenamientoService.pg");
}

export async function getAll() {
  const service = await getService();
  return service.getAll();
}

export async function getById(codigoEntrenamiento: number) {
  const service = await getService();
  return service.getById(codigoEntrenamiento);
}

export async function create(
  idOrganizador: number,
  input: import("./entrenamientoService.pg").EntrenamientoInput
) {
  const service = await getService();
  return service.create(idOrganizador, input);
}

export async function update(
  codigoEntrenamiento: number,
  input: import("./entrenamientoService.pg").EntrenamientoInput
) {
  const service = await getService();
  return service.update(codigoEntrenamiento, input);
}

export async function remove(codigoEntrenamiento: number) {
  const service = await getService();
  return service.remove(codigoEntrenamiento);
}
