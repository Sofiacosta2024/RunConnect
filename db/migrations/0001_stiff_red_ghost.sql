CREATE TABLE "NOTIFICACION" (
	"codigo_notificacion" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"tipo" text NOT NULL,
	"mensaje" text NOT NULL,
	"codigo_entrenamiento" integer,
	"leida" integer DEFAULT 0 NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "NOTIFICACION" ADD CONSTRAINT "NOTIFICACION_email_USUARIO_email_fk" FOREIGN KEY ("email") REFERENCES "public"."USUARIO"("email") ON DELETE no action ON UPDATE no action;