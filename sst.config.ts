import { SSTConfig } from "sst";
import { ReceivingEmail } from "./stacks/ReceivingEmail";

import { config } from "dotenv";
import { Database } from "./stacks/Database";
config();

export default {
  config(_input) {
    return {
      name: "report-generation",
      region: "us-east-1",
    };
  },
  stacks(app) {
    app.stack(Database);
    app.stack(ReceivingEmail);
  },
} satisfies SSTConfig;
