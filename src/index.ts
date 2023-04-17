import { XMLParser } from "fast-xml-parser";
import fs from "fs";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { parseXML } from "./utils/parseXML";
import { arofloTable } from "./database/ArofloDataTable";
import { parseXLSX } from "./utils/parseXLSX";
import { emailDataTable } from "./database/EmailDataTable";
// import { writeTasks } from "./utils/parseXML";

const main = async () => {
  const pool = new Pool({
    connectionString:
      "postgres://postgres:postgres@report-parser.clonccrsix41.eu-west-1.rds.amazonaws.com:5432/reports",
  });
  const db = drizzle(pool);

  await migrate(db, { migrationsFolder: "./migrations" });

  // console.log(await parseXLSX());
  const arofloData = await parseXML();
  // await db.insert(arofloTable).values(arofloData).execute();
  const emailData = await parseXLSX();
  // await db.insert(emailDataTable).values(emailData).execute();
};

main().then(() => {
  process.exit(0);
});
