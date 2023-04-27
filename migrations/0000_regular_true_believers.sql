DO $$ BEGIN
 CREATE TYPE "status" AS ENUM('Stopped', 'Moving');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "aroflo_data" (
	"id" varchar PRIMARY KEY NOT NULL,
	"start_date" bigint,
	"end_date" bigint,
	"location" varchar,
	"description" text,
	"task_id" varchar,
	"user_id" varchar
);

CREATE TABLE IF NOT EXISTS "email_data" (
	"start_date" bigint,
	"end_date" bigint,
	"location" varchar,
	"time_spent" varchar,
	"status" status,
	"user_id" varchar
);
--> statement-breakpoint
ALTER TABLE "email_data" ADD CONSTRAINT "email_data_user_id_start_date" PRIMARY KEY("user_id","start_date");
