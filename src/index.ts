import { Pool } from "pg";
import axios from "axios";
import { drizzle } from "drizzle-orm/node-postgres";

import { arofloTable } from "./database/ArofloDataTable";
import { parseXLSX } from "./utils/parseXLSX";
import { getSchedules } from "./utils/getSchedules";
import ArofloRepository from "./repositories/ArofloRepository";
import EmailDataRepository from "./repositories/EmailDataRepository";
import ReportGenerator from "./utils/generateReport";
import { generateHtmlFromJson } from "./utils/htmlGeneration";
import { S3Event } from "aws-lambda";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { simpleParser } from "mailparser";
import { SecretsManager } from "aws-sdk";
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
import { emailDataTable } from "./database/EmailDataTable";

export const handler = async (event: S3Event) => {
  try {
    const secretsManager = new SecretsManagerClient({
      region: "us-east-1",
    });

    const secrets = await secretsManager.send(
      new GetSecretValueCommand({
        SecretId: process.env.DATABASE_SECRET,
        VersionStage: "AWSCURRENT",
      })
    );

    // await migrate(db, { migrationsFolder: './migrations' });

    const secretValue = JSON.parse(secrets.SecretString!);
    // console.log(
    //   `postgres://${secretValue.username}:${secretValue.password}@${secretValue.host}:${secretValue.port}/${secretValue.dbname}`
    // );
    const pool = new Pool({
      connectionString: `postgres://${secretValue.username}:${secretValue.password}@${secretValue.host}:${secretValue.port}/${secretValue.dbname}`,
    });
    const db = drizzle(pool);

    const client = new S3Client({
      region: "us-east-1",
      credentials: {
        accessKeyId: process.env.ACCESS_KEY!,
        secretAccessKey: process.env.SECRET_ACCESS_KEY!,
      },
    });

    await Promise.all(
      event.Records.map(async (record) => {
        const key = record.s3.object.key;
        const command = new GetObjectCommand({
          Bucket: process.env.BUCKET_NAME,
          Key: key,
        });

        const rawMail = await client.send(command);
        const bytes = Buffer.from(await rawMail.Body!.transformToByteArray());
        const email = await simpleParser(bytes);
        const xlsx = email.attachments[0].content;

        const emailData = await parseXLSX(xlsx);
        // await db // uncomment when production
        //   .insert(emailDataTable)
        //   .values(emailData.records)
        //   .onConflictDoNothing()
        //   .execute();

        // // const tasks = await getTasks(emailData.date); // need further exploration of tasks api
        const schedules = await getSchedules(emailData.startDate); // don't forget to replace this with real api call

        await db
          .insert(arofloTable)
          .values(schedules)
          .onConflictDoNothing()
          .execute();

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

        const htmlTable = generateHtmlFromJson(report);

        // const response = await axios.post(
        //   "https://n3dz368pl5.execute-api.us-east-1.amazonaws.com/default/test",
        //   {
        //     fileKey: "test-report.pdf",
        //     html: htmlTable,
        //   }
        // );
      })
    );
  } catch (err) {
    console.error(err);
  }
};

// handler("sheesh");
