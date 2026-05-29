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
	emailOrganizador: text("email_organizador")
		.notNull()
		.references(() => usuario.email),
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
		codigoCalificacion: integer("codigo_calificacion"),
		rol: text("rol").notNull(),
	},
	(table) => [primaryKey({ columns: [table.codigoEntrenamiento, table.email] })]
);

export const usuarioMensajeEntrenamiento = pgTable(
	"USUARIO_MENSAJE_ENTRENAMIENTO",
	{
		codigoEntrenamiento: integer("codigo_entrenamiento")
			.notNull()
			.references(() => entrenamiento.codigoEntrenamiento),
		email: text("email").notNull().references(() => usuario.email),
	},
	(table) => [primaryKey({ columns: [table.codigoEntrenamiento, table.email] })]
);

export const mensaje = pgTable(
	"MENSAJE",
	{
		fecha: date("fecha").notNull(),
		hora: time("hora").notNull(),
		codigoEntrenamiento: integer("codigo_entrenamiento")
			.notNull()
			.references(() => entrenamiento.codigoEntrenamiento),
		email: text("email").notNull().references(() => usuario.email),
		contenido: text("contenido").notNull(),
	},
	(table) => [
		primaryKey({ columns: [table.fecha, table.hora, table.email] }),
		foreignKey({
			columns: [table.codigoEntrenamiento, table.email],
			foreignColumns: [
				usuarioMensajeEntrenamiento.codigoEntrenamiento,
				usuarioMensajeEntrenamiento.email,
			],
		}),
	]
);

export const calificacion = pgTable(
	"CALIFICACION",
	{
		codigoCalificacion: serial("codigo_calificacion").primaryKey(),
		emailCalificado: text("email_calificado")
			.notNull()
			.references(() => usuario.email),
		emailCalificador: text("email_calificador")
			.notNull()
			.references(() => usuario.email),
		codigoEntrenamiento: integer("codigo_entrenamiento")
			.notNull()
			.references(() => entrenamiento.codigoEntrenamiento),
		puntaje: integer("puntaje").notNull(),
		comentario: text("comentario"),
	},
	(table) => [
		foreignKey({
			columns: [table.emailCalificado, table.codigoEntrenamiento],
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
