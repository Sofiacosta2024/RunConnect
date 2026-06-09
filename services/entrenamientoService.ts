export type { EntrenamientoInput, EntrenamientoListItem, GetFilteredParams } from "./entrenamientoService.pg";

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

export async function getFiltered(
  params: import("./entrenamientoService.pg").GetFilteredParams
) {
  const service = await getService();
  return service.getFiltered(params);
}

export async function getById(codigoEntrenamiento: number) {
  const service = await getService();
  return service.getById(codigoEntrenamiento);
}

export async function create(
  emailOrganizador: string,
  input: import("./entrenamientoService.pg").EntrenamientoInput
) {
  const service = await getService();
  return service.create(emailOrganizador, input);
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

export async function crearEntrenamientoConChat(
  emailOrganizador: string,
  input: Omit<import("./entrenamientoService.pg").EntrenamientoInput, "estado">
) {
  const service = await getService();
  return service.crearEntrenamientoConChat(emailOrganizador, input);
}
