CREATE TABLE "sellers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"distributor_id" uuid NOT NULL,
	"nome" text NOT NULL,
	"telefone" text DEFAULT '' NOT NULL,
	"email" text DEFAULT '' NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "seller_id" uuid;--> statement-breakpoint
ALTER TABLE "sellers" ADD CONSTRAINT "sellers_distributor_id_users_id_fk" FOREIGN KEY ("distributor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "companies" ADD CONSTRAINT "companies_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE set null ON UPDATE no action;