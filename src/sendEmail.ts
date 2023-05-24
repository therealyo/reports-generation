import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import Mail from "nodemailer/lib/mailer";

import ArofloRepository from "./repositories/ArofloRepository";
import EmailDataRepository from "./repositories/EmailDataRepository";
import ReportGenerator, { Report } from "./utils/ReportGenerator";
import { S3Event } from "aws-lambda";
import AWS from "aws-sdk";
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
import nodemailer from "nodemailer";

import {
  generateHtmlFromJson,
  generateReportHTML,
} from "./utils/htmlGeneration";

export const handler = async (event: any) => {
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
    // const pool = new Pool({
    //   connectionString: `postgres://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
    // });
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

    const startDate = new Date("2023-05-02");
    startDate.setHours(0);
    startDate.setMinutes(0);
    startDate.setSeconds(0);
    const endDate = new Date(startDate.valueOf() + 86400000);

    const reports = [] as Report[];

    await Promise.all(
      users.map(async (userId) => {
        const report = await reportGenerator.generateJSONTable(
          userId!,
          startDate.valueOf(),
          endDate.valueOf()
        );

        if (report) {
          reports.push(report);
        }
      })
    );

    const html = generateReportHTML(reports);
    const attachments = [] as Mail.Attachment[];

    attachments.push({
      filename: `Report for ${new Date().getUTCFullYear()}/${
        new Date().getUTCMonth() + 1
      }/${new Date().getUTCDate()}.html`,
      content: html,
    });

    const pdf = await reportGenerator.generatePDFfromHTML(html);
    attachments.push({
      filename: `Report for ${new Date().getUTCFullYear()}/${
        new Date().getUTCMonth() + 1
      }/${new Date().getUTCDate()}.pdf`,
      content: pdf,
    });

    const emailParams: Mail.Options = {
      from: process.env.SOURCE_EMAIL,
      to: process.env.SEND_TO,
      subject: `Report for ${new Date().getUTCFullYear()}/${
        new Date().getUTCMonth() + 1
      }/${new Date().getUTCDate()}`,
      attachments,
    };

    await transporter.sendMail(emailParams);
  } catch (err) {
    console.error(err);
  }
};
