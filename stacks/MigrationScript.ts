import { Function, Script, StackContext, dependsOn, use } from "sst/constructs";
import { Database } from "./Database";

export function MigrationScript({ stack }: StackContext) {
  const { db, vpc, secGroup } = use(Database);
  dependsOn(Database);

  const migrationFunction = new Function(stack, "migration-function", {
    handler: "src/migrateDatabase.handler",
    // vpc,
    // securityGroups: [secGroup],
    copyFiles: [
      {
        from: "migrations",
        to: "migrations",
      },
    ],
    environment: {
      DATABASE_SECRET: db.secret?.secretName!,
    },
    functionName: "migrate-database",
    nodejs: {
      esbuild: {
        external: ["pg-native"],
      },
    },
  });

  migrationFunction.attachPermissions(["secretsmanager"]);
  new Script(stack, "migration-script", {
    onCreate: migrationFunction,
    onUpdate: migrationFunction,
  });
}
