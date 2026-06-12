import {
	customType,
	date,
	foreignKey,
	integer,
	numeric,
	pgEnum,
	pgTable,
	primaryKey,
	serial,
	text,
	time,
	timestamp,
} from "drizzle-orm/pg-core";

const geographyPoint = customType<{ data: string }>({
	dataType() {
		return "geography(Point,4326)";
	},
});

export const entrenamientoEstado = pgEnum("entrenamiento_estado", [
	"abierto",
	"cerrado",
	"cancelado",
	"finalizado",
]);

export const deporte = pgTable("DEPORTE", {
	nombre: text("nombre").primaryKey(),
	descripcionDeporte: text("descripcion_deporte"),
});

export const usuario = pgTable("USUARIO", {
	email: text("email").primaryKey(),
	nombre: text("nombre").notNull(),
	fotoPerfil: text("foto_perfil"),
	ubicacion: text("ubicacion"),
	codigoDeporte: text("codigo_deporte").references(() => deporte.nombre),
});

export const entrenamiento = pgTable("ENTRENAMIENTO", {
	codigoEntrenamiento: serial("codigo_entrenamiento").primaryKey(),
	codigoDeporte: text("codigo_deporte")
		.notNull()
		.references(() => deporte.nombre),
	fechaInicio: timestamp("fecha_inicio", { withTimezone: true }).notNull(),
	fechaFin: timestamp("fecha_fin", { withTimezone: true }).notNull(),
	estado: entrenamientoEstado("estado").notNull().default("abierto"),
	puntoEncuentro: geographyPoint("punto_de_encuentro").notNull(),
	distanciaEstimada: numeric("distancia_estimada", { precision: 6, scale: 2 }),
	ritmoObjetivo: text("ritmo_objetivo"),
	nivel: text("nivel").notNull(),
	cupoMaximo: integer("cupo_maximo"),
});

export const usuarioEntrenamiento = pgTable(
	"USUARIO_ENTRENAMIENTO",
	{
		codigoEntrenamiento: integer("codigo_entrenamiento")
			.notNull()
			.references(() => entrenamiento.codigoEntrenamiento),
		email: text("email").notNull().references(() => usuario.email),
		rol: text("rol").notNull(),
	},
	(table) => [primaryKey({ columns: [table.codigoEntrenamiento, table.email] })]
);

export const mensaje = pgTable(
	"MENSAJE",
	{
		codigoMensaje: serial("codigo_mensaje").primaryKey(),
		creadoEn: timestamp("creado_en", {
   				   mode: "date",
   					 })
      					.defaultNow()
      					.notNull(),
		codigoEntrenamiento: integer("codigo_entrenamiento").notNull(),
		email: text("email").notNull(),
		contenido: text("contenido").notNull(),
	},
	(table) => [
		foreignKey({
			columns: [table.codigoEntrenamiento, table.email],
			foreignColumns: [
				usuarioEntrenamiento.codigoEntrenamiento,
				usuarioEntrenamiento.email,
			],
		}),
	]
);

export const calificacion = pgTable(
	"CALIFICACION",
	{
		emailCalificado: text("email_calificado")
			.notNull()
			.references(() => usuario.email),
		codigoEntrenamiento1: integer("codigo_entrenamiento1").notNull(),
		emailCalificador: text("email_calificador")
			.notNull()
			.references(() => usuario.email),
		codigoEntrenamiento2: integer("codigo_entrenamiento2").notNull(),
		puntaje: integer("puntaje").notNull(),
		comentario: text("comentario"),
	},
	(table) => [
		primaryKey({
			columns: [
				table.emailCalificado,
				table.codigoEntrenamiento1,
				table.emailCalificador,
				table.codigoEntrenamiento2,
			],
		}),
		foreignKey({
			columns: [table.emailCalificado, table.codigoEntrenamiento1],
			foreignColumns: [
				usuarioEntrenamiento.email,
				usuarioEntrenamiento.codigoEntrenamiento,
			],
		}),
		foreignKey({
			columns: [table.emailCalificador, table.codigoEntrenamiento2],
			foreignColumns: [
				usuarioEntrenamiento.email,
				usuarioEntrenamiento.codigoEntrenamiento,
			],
		}),
	]
);

export const usuarioDeporte = pgTable(
	"USUARIO_DEPORTE",
	{
		codigoDeporte: text("codigo_deporte")
			.notNull()
			.references(() => deporte.nombre),
		email: text("email").notNull().references(() => usuario.email),
	},
	(table) => [primaryKey({ columns: [table.codigoDeporte, table.email] })]
);


export const solicitudEstado = pgEnum("solicitud_estado", [
	"aprobado",
	"rechazado",
	"pendiente",
]);

export const solicitud = pgTable("SOLICITUD", {
	codigoSolicitud: serial("codigo_solicitud").primaryKey(),
	email: text("email").notNull().references(() => usuario.email),
	codigoEntrenamiento: integer("codigo_entrenamiento")
		.notNull()
		.references(() => entrenamiento.codigoEntrenamiento),
	estado: solicitudEstado("estado").notNull().default("pendiente"),
	fecha: timestamp("fecha", { withTimezone: true }).notNull(),
});

export const notificacion = pgTable("NOTIFICACION", {
  codigoNotificacion: serial("codigo_notificacion").primaryKey(),
  email: text("email").notNull().references(() => usuario.email),
  tipo: text("tipo").notNull(),
  mensaje: text("mensaje").notNull(),
  codigoEntrenamiento: integer("codigo_entrenamiento"),
  leida: integer("leida").notNull().default(0),
  creadoEn: timestamp("creado_en", { withTimezone: true }).defaultNow().notNull(),
});

export const grupoSolicitud = pgTable(
	"GRUPO_SOLICITUD",
	{
		codigoEntrenamiento: integer("codigo_entrenamiento")
			.notNull()
			.references(() => entrenamiento.codigoEntrenamiento),
		email: text("email").notNull().references(() => usuario.email),
	},
	(table) => [primaryKey({ columns: [table.codigoEntrenamiento, table.email] })]
);
