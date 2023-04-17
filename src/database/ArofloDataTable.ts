import { InferModel } from "drizzle-orm";
import {
  pgEnum,
  pgTable,
  serial,
  integer,
  uniqueIndex,
  varchar,
  bigint,
  text,
} from "drizzle-orm/pg-core";

export type ArofloModel = InferModel<typeof arofloTable, "select">;
export type NewArofloModel = InferModel<typeof arofloTable, "insert">;

export const arofloTable = pgTable("aroflo_data", {
  id: serial("id").primaryKey(),
  startDate: bigint("start_date", { mode: "number" }),
  endDate: bigint("end_date", { mode: "number" }),
  location: varchar("location"),
  description: text("description"),
  taskId: varchar("task_id"),
  userId: varchar("user_id"),
});
