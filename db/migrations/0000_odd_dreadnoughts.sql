CREATE TYPE "public"."entrenamiento_estado" AS ENUM('abierto', 'cerrado', 'cancelado', 'finalizado');--> statement-breakpoint
CREATE TYPE "public"."solicitud_estado" AS ENUM('aprobado', 'rechazado', 'pendiente');--> statement-breakpoint
CREATE TABLE "CALIFICACION" (
	"email_calificado" text NOT NULL,
	"codigo_entrenamiento1" integer NOT NULL,
	"email_calificador" text NOT NULL,
	"codigo_entrenamiento2" integer NOT NULL,
	"puntaje" integer NOT NULL,
	"comentario" text,
	CONSTRAINT "CALIFICACION_email_calificado_codigo_entrenamiento1_email_calificador_codigo_entrenamiento2_pk" PRIMARY KEY("email_calificado","codigo_entrenamiento1","email_calificador","codigo_entrenamiento2")
);
--> statement-breakpoint
CREATE TABLE "DEPORTE" (
	"nombre" text PRIMARY KEY NOT NULL,
	"descripcion_deporte" text
);
--> statement-breakpoint
CREATE TABLE "ENTRENAMIENTO" (
	"codigo_entrenamiento" serial PRIMARY KEY NOT NULL,
	"codigo_deporte" text NOT NULL,
	"fecha_inicio" timestamp with time zone NOT NULL,
	"fecha_fin" timestamp with time zone NOT NULL,
	"estado" "entrenamiento_estado" DEFAULT 'abierto' NOT NULL,
	"punto_de_encuentro" geography(Point,4326) NOT NULL,
	"distancia_estimada" numeric(6, 2),
	"ritmo_objetivo" text,
	"nivel" text NOT NULL,
	"cupo_maximo" integer
);
--> statement-breakpoint
CREATE TABLE "GRUPO_SOLICITUD" (
	"codigo_entrenamiento" integer NOT NULL,
	"email" text NOT NULL,
	CONSTRAINT "GRUPO_SOLICITUD_codigo_entrenamiento_email_pk" PRIMARY KEY("codigo_entrenamiento","email")
);
--> statement-breakpoint
CREATE TABLE "MENSAJE" (
	"codigo_mensaje" serial PRIMARY KEY NOT NULL,
	"creado_en" timestamp DEFAULT now() NOT NULL,
	"codigo_entrenamiento" integer NOT NULL,
	"email" text NOT NULL,
	"contenido" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "SOLICITUD" (
	"codigo_solicitud" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"codigo_entrenamiento" integer NOT NULL,
	"estado" "solicitud_estado" DEFAULT 'pendiente' NOT NULL,
	"fecha" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "USUARIO" (
	"email" text PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"foto_perfil" text,
	"ubicacion" text,
	"codigo_deporte" text
);
--> statement-breakpoint
CREATE TABLE "USUARIO_DEPORTE" (
	"codigo_deporte" text NOT NULL,
	"email" text NOT NULL,
	CONSTRAINT "USUARIO_DEPORTE_codigo_deporte_email_pk" PRIMARY KEY("codigo_deporte","email")
);
--> statement-breakpoint
CREATE TABLE "USUARIO_ENTRENAMIENTO" (
	"codigo_entrenamiento" integer NOT NULL,
	"email" text NOT NULL,
	"rol" text NOT NULL,
	CONSTRAINT "USUARIO_ENTRENAMIENTO_codigo_entrenamiento_email_pk" PRIMARY KEY("codigo_entrenamiento","email")
);
--> statement-breakpoint
ALTER TABLE "CALIFICACION" ADD CONSTRAINT "CALIFICACION_email_calificado_USUARIO_email_fk" FOREIGN KEY ("email_calificado") REFERENCES "public"."USUARIO"("email") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "CALIFICACION" ADD CONSTRAINT "CALIFICACION_email_calificador_USUARIO_email_fk" FOREIGN KEY ("email_calificador") REFERENCES "public"."USUARIO"("email") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "CALIFICACION" ADD CONSTRAINT "CALIFICACION_email_calificado_codigo_entrenamiento1_USUARIO_ENTRENAMIENTO_email_codigo_entrenamiento_fk" FOREIGN KEY ("email_calificado","codigo_entrenamiento1") REFERENCES "public"."USUARIO_ENTRENAMIENTO"("email","codigo_entrenamiento") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "CALIFICACION" ADD CONSTRAINT "CALIFICACION_email_calificador_codigo_entrenamiento2_USUARIO_ENTRENAMIENTO_email_codigo_entrenamiento_fk" FOREIGN KEY ("email_calificador","codigo_entrenamiento2") REFERENCES "public"."USUARIO_ENTRENAMIENTO"("email","codigo_entrenamiento") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ENTRENAMIENTO" ADD CONSTRAINT "ENTRENAMIENTO_codigo_deporte_DEPORTE_nombre_fk" FOREIGN KEY ("codigo_deporte") REFERENCES "public"."DEPORTE"("nombre") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "GRUPO_SOLICITUD" ADD CONSTRAINT "GRUPO_SOLICITUD_codigo_entrenamiento_ENTRENAMIENTO_codigo_entrenamiento_fk" FOREIGN KEY ("codigo_entrenamiento") REFERENCES "public"."ENTRENAMIENTO"("codigo_entrenamiento") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "GRUPO_SOLICITUD" ADD CONSTRAINT "GRUPO_SOLICITUD_email_USUARIO_email_fk" FOREIGN KEY ("email") REFERENCES "public"."USUARIO"("email") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "MENSAJE" ADD CONSTRAINT "MENSAJE_codigo_entrenamiento_email_USUARIO_ENTRENAMIENTO_codigo_entrenamiento_email_fk" FOREIGN KEY ("codigo_entrenamiento","email") REFERENCES "public"."USUARIO_ENTRENAMIENTO"("codigo_entrenamiento","email") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "SOLICITUD" ADD CONSTRAINT "SOLICITUD_email_USUARIO_email_fk" FOREIGN KEY ("email") REFERENCES "public"."USUARIO"("email") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "SOLICITUD" ADD CONSTRAINT "SOLICITUD_codigo_entrenamiento_ENTRENAMIENTO_codigo_entrenamiento_fk" FOREIGN KEY ("codigo_entrenamiento") REFERENCES "public"."ENTRENAMIENTO"("codigo_entrenamiento") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "USUARIO" ADD CONSTRAINT "USUARIO_codigo_deporte_DEPORTE_nombre_fk" FOREIGN KEY ("codigo_deporte") REFERENCES "public"."DEPORTE"("nombre") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "USUARIO_DEPORTE" ADD CONSTRAINT "USUARIO_DEPORTE_codigo_deporte_DEPORTE_nombre_fk" FOREIGN KEY ("codigo_deporte") REFERENCES "public"."DEPORTE"("nombre") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "USUARIO_DEPORTE" ADD CONSTRAINT "USUARIO_DEPORTE_email_USUARIO_email_fk" FOREIGN KEY ("email") REFERENCES "public"."USUARIO"("email") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "USUARIO_ENTRENAMIENTO" ADD CONSTRAINT "USUARIO_ENTRENAMIENTO_codigo_entrenamiento_ENTRENAMIENTO_codigo_entrenamiento_fk" FOREIGN KEY ("codigo_entrenamiento") REFERENCES "public"."ENTRENAMIENTO"("codigo_entrenamiento") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "USUARIO_ENTRENAMIENTO" ADD CONSTRAINT "USUARIO_ENTRENAMIENTO_email_USUARIO_email_fk" FOREIGN KEY ("email") REFERENCES "public"."USUARIO"("email") ON DELETE no action ON UPDATE no action;