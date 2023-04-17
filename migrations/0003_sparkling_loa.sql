DO $$ BEGIN
 CREATE TYPE "status" AS ENUM('Stopped', 'Moving');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "email_data" ADD COLUMN "status" "status";