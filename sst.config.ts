import { SSTConfig } from "sst";
import { ReceivingEmail } from "./stacks/ReceivingEmail";

import { config } from "dotenv";
import { Database } from "./stacks/Database";
import { ReportGeneration } from "./stacks/PDFGeneration";
import { SendReports } from "./stacks/SendReports";
config();

export default {
  config(_input) {
    return {
      profile: "samuel",
      name: "report-generation-test",
      region: "us-west-2",
    };
  },
  stacks(app) {
    // app.stack(Database);
    app.stack(ReportGeneration);
    app.stack(ReceivingEmail);
    app.stack(SendReports);
  },
} satisfies SSTConfig;
