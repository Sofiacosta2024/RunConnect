import {
	date,
	integer,
	numeric,
	pgTable,
	primaryKey,
	serial,
	text,
	time,
	timestamp,
} from "drizzle-orm/pg-core";

export const deporte = pgTable("DEPORTE", {
	nombre: text("nombre").primaryKey(),
	descripcionDeporte: text("descripcion_deporte"),
});

export const nivelEntrenamiento = pgTable("NIVEL_ENTRENAMIENTO", {
	nivel: text("nivel").primaryKey(),
	descripcionNivel: text("descripcion_nivel"),
});

export const usuario = pgTable("USUARIO", {
	email: text("email").primaryKey(),
	nombre: text("nombre").notNull(),
	contrasena: text("contrasena").notNull(),
	fotoPerfil: text("foto_perfil"),
	ubicacion: text("ubicacion"),
	codigoDeporte: text("codigo_deporte").references(() => deporte.nombre),
});

export const organizador = pgTable("ORGANIZADOR", {
	idOrganizador: serial("id_organizador").primaryKey(),
	email: text("email")
		.notNull()
		.references(() => usuario.email),
});

export const entrenamiento = pgTable("ENTRENAMIENTO", {
	codigoEntrenamiento: serial("codigo_entrenamiento").primaryKey(),
	idOrganizador: integer("id_organizador")
		.notNull()
		.references(() => organizador.idOrganizador),
	codigoDeporte: text("codigo_deporte")
		.notNull()
		.references(() => deporte.nombre),
	fecha: date("fecha").notNull(),
	hora: time("hora").notNull(),
	puntoEncuentro: text("punto_de_encuentro").notNull(),
	distanciaEstimada: numeric("distancia_estimada", {
		precision: 6,
		scale: 2,
	}),
	ritmoObjetivo: text("ritmo_objetivo"),
	codigoNivel: text("codigo_nivel")
		.notNull()
		.references(() => nivelEntrenamiento.nivel),
	cupoMaximo: integer("cupo_maximo"),
});

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
	(table) => [primaryKey({ columns: [table.fecha, table.hora] })]
);

export const calificacion = pgTable("CALIFICACION", {
	codigoCalificacion: serial("codigo_calificacion").primaryKey(),
	email: text("email").notNull().references(() => usuario.email),
	idOrganizador: integer("id_organizador")
		.notNull()
		.references(() => organizador.idOrganizador),
	codigoEntrenamiento: integer("codigo_entrenamiento")
		.notNull()
		.references(() => entrenamiento.codigoEntrenamiento),
	puntaje: integer("puntaje").notNull(),
	comentario: text("comentario"),
});

/*

export const solicitud = pgTable("SOLICITUD", {
	codigoSolicitud: serial("codigo_solicitud").primaryKey(),
	email: text("email").notNull().references(() => usuario.email),
	codigoEntrenamiento: integer("codigo_entrenamiento")
		.notNull()
		.references(() => entrenamiento.codigoEntrenamiento),
	codigoEstado: integer("codigo_estado")
		.notNull()
		.references(() => estadoSolicitud.codigoEstado),
	fecha: date("fecha").notNull(),
});

export const estadoSolicitud = pgTable("ESTADO_SOLICITUD", {
	codigoEstado: serial("codigo_estado").primaryKey(),
	descripcionEstado: text("descripcion_estado").notNull(),
	codigoSolicitud: integer("codigo_solicitud").references(
		() => solicitud.codigoSolicitud
	),
});


*/
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

export const participacion = pgTable(
	"PARTICIPACION",
	{
		email: text("email").notNull().references(() => usuario.email),
		codigoEntrenamiento: integer("codigo_entrenamiento")
			.notNull()
			.references(() => entrenamiento.codigoEntrenamiento),
		fechaInscripcion: timestamp("fecha_inscripcion", {
			withTimezone: true,
		}).notNull(),
	},
	(table) => [primaryKey({ columns: [table.email, table.codigoEntrenamiento] })]
);

