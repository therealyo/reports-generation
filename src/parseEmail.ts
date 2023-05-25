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
import Lambda from "aws-sdk/clients/lambda";
import AWS from "aws-sdk";

export const handler = async (event: S3Event) => {
  try {
    const secretsManager = new SecretsManagerClient({
      region: process.env.AWS_REGION,
    });

    const secrets = await secretsManager.send(
      new GetSecretValueCommand({
        SecretId: process.env.DATABASE_SECRET,
        VersionStage: "AWSCURRENT",
      })
    );

    const secretValue = JSON.parse(secrets.SecretString!);
    const pool = new Pool({
      connectionString: `postgres://${secretValue.username}:${secretValue.password}@${secretValue.host}:${secretValue.port}/${secretValue.dbname}`,
    });
    const db = drizzle(pool);

    const client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.ACCESS_KEY!,
        secretAccessKey: process.env.SECRET_ACCESS_KEY!,
      },
    });

    const lambda = new AWS.Lambda({ region: process.env.AWS_REGION });

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
          FunctionName: process.env.EMAIL_LAMBDA_NAME!,
          Payload: JSON.stringify({
            date: emailData[0].startDate.replace(/\//g, "-"),
          }),
        };

        await lambda.invoke(params).promise();
      })
    );
  } catch (err) {
    console.error(err);
  }
};
