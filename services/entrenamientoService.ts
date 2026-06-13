export type { EntrenamientoInput, EntrenamientoListItem, GetFilteredParams } from "./entrenamientoService.pg";

type EntrenamientoService = typeof import("./entrenamientoService.pg");

const isSqliteMode = process.env.DB_MODE === "sqlite";

async function getService(): Promise<EntrenamientoService> {
  if (isSqliteMode) {
    return import("./entrenamientoService.sqlite");
  }

  return import("./entrenamientoService.pg");
}

export async function getAll(pagina?: number, limite?: number) {
  const service = await getService();
  return service.getAll(pagina, limite);
}

export async function getFiltered(
  params: import("./entrenamientoService.pg").GetFilteredParams,
  pagina?: number,
  limite?: number
) {
  const service = await getService();
  return service.getFiltered(params, pagina, limite);
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

export async function finalizar(codigoEntrenamiento: number, emailOrganizador: string) {
  const service = await getService();
  return service.finalizar(codigoEntrenamiento, emailOrganizador);
}

export async function crearEntrenamientoConChat(
  emailOrganizador: string,
  input: Omit<import("./entrenamientoService.pg").EntrenamientoInput, "estado">
) {
  const service = await getService();
  return service.crearEntrenamientoConChat(emailOrganizador, input);
}

export async function getMisEntrenamientos(
    email: string,
    pagina?: number,
    limite?: number
) {
    const service = await getService();
    return service.getMisEntrenamientos(email, pagina, limite);
}

export async function finalizarVencidos() {
    const service = await getService();
    return service.finalizarVencidos();
}