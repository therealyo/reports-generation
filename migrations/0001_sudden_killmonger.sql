ALTER TABLE "email_data" DROP CONSTRAINT "email_data_user_id_start_date";
ALTER TABLE "email_data" ADD CONSTRAINT "email_data_name_start_date" PRIMARY KEY("name","start_date");