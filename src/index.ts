import { Pool } from "pg";
import axios from "axios";
import { drizzle } from "drizzle-orm/node-postgres";

import { arofloTable } from "./database/ArofloDataTable";
import { parseXLSX } from "./utils/parseXLSX";
import { getSchedules } from "./utils/getSchedules";
import ArofloRepository from "./repositories/ArofloRepository";
import EmailDataRepository from "./repositories/EmailDataRepository";
import ReportGenerator from "./utils/ReportGenerator";
import { generateHtmlFromJson } from "./utils/htmlGeneration";
import { S3Event } from "aws-lambda";
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { simpleParser } from "mailparser";
import AWS, { SecretsManager } from "aws-sdk";
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
import { emailDataTable } from "./database/EmailDataTable";
import nodemailer from "nodemailer";

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

    const transporter = nodemailer.createTransport({
      SES: new AWS.SES({
        apiVersion: "2010-12-01",
      }),
    });
    // await migrate(db, { migrationsFolder: './migrations' });

    const secretValue = JSON.parse(secrets.SecretString!);
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
        // await db
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

        const pdf = await reportGenerator.generatePDFfromHTML(htmlTable);

        const emailTransportAttachment = {
          filename: `${new Date().toUTCString()}.pdf`,
          content: pdf,
        };

        const emailParams = {
          from: process.env.SOURCE_EMAIL,
          to: process.env.SEND_TO,
          subject: `${
            emailData.user
          } report for ${new Date().getUTCDate()}/${new Date().getUTCMonth()}/${new Date().getUTCFullYear()}`,
          attachments: [emailTransportAttachment],
        };

        await transporter.sendMail(emailParams);
      })
    );
  } catch (err) {
    console.error(err);
  }
};
