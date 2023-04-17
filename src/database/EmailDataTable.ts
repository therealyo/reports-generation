import { InferModel } from "drizzle-orm";
import {
  bigint,
  pgEnum,
  pgTable,
  serial,
  text,
  varchar,
} from "drizzle-orm/pg-core";

export type EmailDataModel = InferModel<typeof emailDataTable, "select">;
export type NewEmailDataModel = InferModel<typeof emailDataTable, "insert">;

export enum Status {
  STOPPED = "Stopped",
  MOVING = "Moving",
}

export const statusEnum = pgEnum(
  "status",
  Object.values(Status) as [string, ...string[]]
);

export const emailDataTable = pgTable("email_data", {
  id: serial("id").primaryKey(),
  startDate: bigint("start_date", { mode: "number" }),
  endDate: bigint("end_date", { mode: "number" }),
  location: varchar("location"),
  timeSpent: varchar("time_spent"),
  status: statusEnum("status"),
  userId: varchar("user_id"),
});
