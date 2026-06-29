CREATE TABLE "companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"distributor_id" uuid NOT NULL,
	"nome" text NOT NULL,
	"cidade" text DEFAULT '' NOT NULL,
	"responsavel" text DEFAULT '' NOT NULL,
	"telefone" text DEFAULT '' NOT NULL,
	"email" text DEFAULT '' NOT NULL,
	"convidados_previstos" integer DEFAULT 0 NOT NULL,
	"observacoes" text DEFAULT '' NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "company_id" uuid;--> statement-breakpoint
ALTER TABLE "companies" ADD CONSTRAINT "companies_distributor_id_users_id_fk" FOREIGN KEY ("distributor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;