CREATE TABLE IF NOT EXISTS "aroflo_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"start_date" bigint,
	"end_date" bigint,
	"location" varchar,
	"description" text,
	"user_id" varchar
);

CREATE TABLE IF NOT EXISTS "email_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"start_date" bigint,
	"end_date" bigint,
	"location" varchar,
	"user_id" varchar
);
