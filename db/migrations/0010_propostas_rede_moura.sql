ALTER TABLE "proposals" ALTER COLUMN "distributor_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "proposals" ADD COLUMN "moura_id" text;--> statement-breakpoint
ALTER TABLE "proposals" ADD COLUMN "distribuidor_nome" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "proposals" ADD COLUMN "distribuidor_cidade" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "proposals" ADD COLUMN "distribuidor_email" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_distribuidor_check" CHECK ("distributor_id" IS NOT NULL OR "moura_id" IS NOT NULL);