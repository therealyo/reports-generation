import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";

export const handler = async () => {
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

  await migrate(db, { migrationsFolder: "./migrations" });
};
