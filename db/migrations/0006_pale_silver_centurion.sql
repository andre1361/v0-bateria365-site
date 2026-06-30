CREATE TABLE "link_pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"titulo" text NOT NULL,
	"descricao" text DEFAULT '' NOT NULL,
	"slug" text NOT NULL,
	"logo_url" text DEFAULT '' NOT NULL,
	"accent" text DEFAULT '' NOT NULL,
	"tabs" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "link_pages_slug_unique" UNIQUE("slug")
);
