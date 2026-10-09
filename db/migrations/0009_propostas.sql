CREATE TYPE "public"."proposal_status" AS ENUM('rascunho', 'enviada', 'aceita', 'cancelada');--> statement-breakpoint
CREATE TABLE "flight_search_cache" (
	"chave" text PRIMARY KEY NOT NULL,
	"resultados" jsonb NOT NULL,
	"buscado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proposal_settings" (
	"id" text PRIMARY KEY DEFAULT 'padrao' NOT NULL,
	"hotel_diaria" integer NOT NULL,
	"alimentacao_dia" integer NOT NULL,
	"uber_fixo" integer NOT NULL,
	"honorario" integer NOT NULL,
	"acrescimo_pct" integer DEFAULT 0 NOT NULL,
	"validade_dias" integer DEFAULT 10 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proposals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"distributor_id" uuid NOT NULL,
	"slug" text,
	"chave_hash" text,
	"chave_plain" text,
	"destino_iata" text DEFAULT '' NOT NULL,
	"destino_cidade" text DEFAULT '' NOT NULL,
	"data_inicio_iso" text DEFAULT '' NOT NULL,
	"duracao_dias" integer DEFAULT 1 NOT NULL,
	"ida_iso" text DEFAULT '' NOT NULL,
	"volta_iso" text DEFAULT '' NOT NULL,
	"parametros" jsonb NOT NULL,
	"validade_dias" integer DEFAULT 10 NOT NULL,
	"voos" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"total" integer DEFAULT 0 NOT NULL,
	"status" "proposal_status" DEFAULT 'rascunho' NOT NULL,
	"valida_ate" timestamp with time zone,
	"enviada_em" timestamp with time zone,
	"aceita_em" timestamp with time zone,
	"event_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "proposals_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_distributor_id_users_id_fk" FOREIGN KEY ("distributor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;