import { XMLParser } from "fast-xml-parser";
import fs from "fs";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { parseXML } from "./utils/parseXML";
import { arofloTable } from "./database/ArofloDataTable";
import { parseXLSX } from "./utils/parseXLSX";
import { emailDataTable } from "./database/EmailDataTable";
import { getTasks } from "./utils/getTasks";
import { getSchedules } from "./utils/getSchedules";
import ArofloRepository from "./repositories/ArofloRepository";
import EmailDataRepository from "./repositories/EmailDataRepository";
import ReportGenerator from "./utils/generateReport";
// import { writeTasks } from "./utils/parseXML";

const main = async () => {
  const pool = new Pool({
    connectionString:
      "postgres://postgres:postgres@report-parser.clonccrsix41.eu-west-1.rds.amazonaws.com:5432/reports",
  });
  const db = drizzle(pool);

  await migrate(db, { migrationsFolder: "./migrations" });

  // console.log(await parseXLSX());
  // const arofloData = await parseXML();
  // await db.insert(arofloTable).values(arofloData).execute();
  const emailData = await parseXLSX();
  // console.log(emailData);

  console.log(
    new Date(emailData.startDate).valueOf(),
    new Date(emailData.endDate).valueOf()
  );

  // console.log(new Date("2023-03-02 1:54:44").valueOf());
  // // console.log(emailData.records.slice(0, 10));
  // // await db
  // //   .insert(emailDataTable)
  // //   .values(emailData.records)
  // //   .onConflictDoNothing()
  // //   .execute();
  // // console.log(emailData.date);
  // // const tasks = await getTasks(emailData.date);
  // // console.log(tasks.length);
  // const schedules = await getSchedules(emailData.date);
  // // console.log(schedules.slice(0, 10));
  // await db
  //   .insert(arofloTable)
  //   .values(schedules)
  //   .onConflictDoNothing()
  //   .execute();

  // console.log(emailData.user);
  // console.log(new Date(emailData.date).valueOf());

  // console.log(new Date(1677714884000));

  const arofloRepository = new ArofloRepository(db);
  const emailDataRepository = new EmailDataRepository(db);
  const reportGenerator = new ReportGenerator(
    arofloRepository,
    emailDataRepository
  );

  const report = await reportGenerator.generateJSONTable(
    emailData.user,
    new Date(emailData.startDate).valueOf(),
    new Date(emailData.endDate).valueOf()
  );

  console.log(report);

  fs.writeFileSync("test-report.json", JSON.stringify(report, null, 2));
  // for (let schedule of Object.values(schedules)) {

  // }
  // console.log(schedules);
  // await db.insert(emailDataTable).values(emailData).execute();
};

main().then(() => {
  process.exit(0);
});
