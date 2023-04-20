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
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { generateHtmlFromJson } from "./utils/htmlGeneration";
import axios from "axios";
// import { writeTasks } from "./utils/parseXML";

export const handler = async (event: any) => {
  try {
    console.log(event);
    const pool = new Pool({
      connectionString:
        "postgres://postgres:postgres@report-parser.clonccrsix41.eu-west-1.rds.amazonaws.com:5432/reports",
    });
    const db = drizzle(pool);

    // await migrate(db, { migrationsFolder: "./migrations" });

    // console.log(await parseXLSX());
    // const arofloData = await parseXML();
    // await db.insert(arofloTable).values(arofloData).execute();
    // const client = new S3Client({
    //   region: "us-east-1",
    //   credentials: {
    //     accessKeyId: process.env.AWS_ACCESS!,
    //     secretAccessKey: process.env.AWS_SECRET!,
    //   },
    // });
    const emailData = {
      user: "JSc6UyZRTEwgCg==",
      startDate: "2023-03-02 01:00:00 - 2023-03-03 23:00:00"
        .split(" ")[0]
        .replace(/-/g, "/"),
      endDate: "2023-03-02 01:00:00 - 2023-03-03 23:00:00"
        .split(" ")[3]
        .replace(/-/g, "/"),
    };

    // const emailData = await parseXLSX("sheesh");
    // console.log(emailData);

    // console.log(
    //   new Date(emailData.startDate).valueOf(),
    //   new Date(emailData.endDate).valueOf()
    // );

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

    const report = reportGenerator.generateJSONTable(
      emailData.user,
      new Date(emailData.startDate).valueOf(),
      new Date(emailData.endDate).valueOf()
    );

    const htmlTable = generateHtmlFromJson(report);

    await axios.post(
      "https://n3dz368pl5.execute-api.us-east-1.amazonaws.com/default/test",
      {
        fileKey: "test-report.pdf",
        htmlTable,
      }
    );
  } catch (err) {
    console.error(err);
  }
  // const report = await reportGenerator.generateJSONTable(
  // emailData.user,
  // new Date(emailData.startDate).valueOf(),
  // new Date(emailData.endDate).valueOf()
  // );

  // console.log(report);

  // const bucketName = "trick-storage-therealyo";
  // const command = new PutObjectCommand({
  //   ACL: "public-read",
  //   Bucket: bucketName,
  //   Key: "test-report.json",
  //   Body: report,
  // });

  // await client.send(command);

  // fs.writeFileSync("test-report.json", JSON.stringify(report, null, 2));
  // for (let schedule of Object.values(schedules)) {

  // }
  // console.log(schedules);
  // await db.insert(emailDataTable).values(emailData).execute();
};

// main().then(() => {
//   process.exit(0);
// });
