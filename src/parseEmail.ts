import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

import { arofloTable } from "./database/ArofloDataTable";
import { S3Event } from "aws-lambda";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { simpleParser } from "mailparser";

import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
import { emailDataTable } from "./database/EmailDataTable";
import ArofloApi from "./externalApi/ArofloApi";
import XLSXParser from "./utils/XLSXParser";
import ReportGenerator from "./utils/ReportGenerator";
import ArofloRepository from "./repositories/ArofloRepository";
import EmailDataRepository from "./repositories/EmailDataRepository";
import Lambda from "aws-sdk/clients/lambda";
import AWS from "aws-sdk";

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

    const secretValue = JSON.parse(secrets.SecretString!);
    // const pool = new Pool({
    //   connectionString: `postgres://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
    // });
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

    // const aroflo = new ArofloRepository(db)
    // const email = new EmailDataRepository(db)
    // const reportGenerator = new ReportGenerator(aroflo, email)

    const lambda = new AWS.Lambda({ region: "us-east-1" });

    const arofloApi = new ArofloApi();
    const xlsxParser = new XLSXParser(arofloApi);

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

        const emailData = await xlsxParser.parseXLSX(xlsx);

        for (let user of emailData) {
          if (user.records.length)
            await db
              .insert(emailDataTable)
              .values(user.records)
              .onConflictDoNothing()
              .execute();
        }

        const schedules = await arofloApi.getSchedules(emailData[0].startDate);
        await db
          .insert(arofloTable)
          .values(schedules)
          .onConflictDoNothing()
          .execute();

        const params: Lambda.Types.InvocationRequest = {
          FunctionName: process.env.PDF_LAMBDA_NAME!,
        };

        await lambda.invoke(params).promise();
      })
    );
  } catch (err) {
    console.error(err);
  }
};
