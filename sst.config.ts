import { SSTConfig } from "sst";
import { ReceivingEmail } from "./stacks/ReceivingEmail";

import { config } from "dotenv";
import { Database } from "./stacks/Database";
import { ReportGeneration } from "./stacks/PDFGeneration";
import { SendReports } from "./stacks/SendReports";
import { MigrationScript } from "./stacks/MigrationScript";
config();

export default {
  config(_input) {
    return {
      name: "report-generation",
      region: process.env.AWS_REGION,
    };
  },
  stacks(app) {
    app.stack(Database);
    app.stack(MigrationScript);
    app.stack(ReportGeneration);
    app.stack(SendReports);
    app.stack(ReceivingEmail);
  },
} satisfies SSTConfig;
