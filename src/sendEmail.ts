import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

import ArofloRepository from "./repositories/ArofloRepository";
import EmailDataRepository from "./repositories/EmailDataRepository";
import ReportGenerator from "./utils/ReportGenerator";
import { generateHtmlFromJson } from "./utils/htmlGeneration";
import { S3Event } from "aws-lambda";
import AWS from "aws-sdk";
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
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

    const secretValue = JSON.parse(secrets.SecretString!);
    const pool = new Pool({
      connectionString: `postgres://${secretValue.username}:${secretValue.password}@${secretValue.host}:${secretValue.port}/${secretValue.dbname}`,
    });
    const db = drizzle(pool);

    const arofloRepository = new ArofloRepository(db);
    const emailDataRepository = new EmailDataRepository(db);
    const reportGenerator = new ReportGenerator(
      arofloRepository,
      emailDataRepository
    );

    const users = await arofloRepository.getUsers();

    const startDate = new Date();
    startDate.setHours(0);
    startDate.setMinutes(0);
    startDate.setSeconds(0);
    const endDate = new Date(startDate.valueOf() + 86400000);

    const reports: { [userId: string]: string } = {};

    await Promise.all(
      users.map(async (userId) => {
        const report = await reportGenerator.generateJSONTable(
          userId!,
          startDate.valueOf(),
          endDate.valueOf()
        );

        if (report.length !== 0) {
          const htmlTable = generateHtmlFromJson(report);
          reports[userId!] = htmlTable;
        }
      })
    );
    const pdfs = await reportGenerator.generatePDFfromHTML(reports);

    // @ts-ignore
    for (const [userId, pdf] of Object.entries(pdfs)) {
      const emailTransportAttachment = {
        filename: `${new Date().toUTCString()}.pdf`,
        content: Buffer.from(pdf.data),
      };

      const emailParams = {
        from: process.env.SOURCE_EMAIL,
        to: process.env.SEND_TO,
        subject: `${userId} report for ${new Date().getUTCDate()}/${new Date().getUTCMonth()}/${new Date().getUTCFullYear()}`,
        attachments: [emailTransportAttachment],
      };

      await transporter.sendMail(emailParams);
    }
  } catch (err) {
    console.error(err);
  }
};
