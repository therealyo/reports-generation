import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { config } from "dotenv";
config();

const main = async () => {
  console.log(
    "DATABSE_URL",
    `postgres://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`
  );
  const pool = new Pool({
    connectionString: `postgres://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
  });
  const db = drizzle(pool);

  await migrate(db, { migrationsFolder: "./migrations" });
};

main()
  .then(() => process.exit(0))
  .catch((err) => console.error(err));
