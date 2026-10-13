ALTER TABLE "proposal_settings" ADD COLUMN "visitas_tecnicas" integer DEFAULT 3 NOT NULL;--> statement-breakpoint
ALTER TABLE "proposals" ADD COLUMN "responsavel" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "proposals" ADD COLUMN "cnpj" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "proposals" ADD COLUMN "endereco" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "proposals" ADD COLUMN "visitas_tecnicas" integer DEFAULT 3 NOT NULL;