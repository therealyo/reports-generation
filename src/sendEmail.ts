import { Pool } from "pg";
import AWS from "aws-sdk";
import { drizzle } from "drizzle-orm/node-postgres";
import Mail from "nodemailer/lib/mailer";
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
import nodemailer from "nodemailer";

import ArofloRepository from "./repositories/ArofloRepository";
import EmailDataRepository from "./repositories/EmailDataRepository";
import ReportGenerator, { Report } from "./utils/ReportGenerator";

import {
  generateHtmlFromJson,
  generateReportHTML,
} from "./utils/htmlGeneration";

export const handler = async (event: { date: string }) => {
  try {
    const { date } = event;
    const secretsManager = new SecretsManagerClient({
      region: process.env.AWS_REGION,
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

    const users = await emailDataRepository.getUsers();

    const startDate = new Date(date);
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
    const pdf = await reportGenerator.generatePDFfromHTML(html);

    const htmlAttachment = {
      filename: `Report for ${new Date().getUTCFullYear()}/${
        new Date().getUTCMonth() + 1
      }/${new Date().getUTCDate()}.html`,
      content: html,
    };

    const pdfAttachment = {
      filename: `Report for ${date}.pdf`,
      content: pdf,
    };

    const attachments = [htmlAttachment, pdfAttachment] as Mail.Attachment[];

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
