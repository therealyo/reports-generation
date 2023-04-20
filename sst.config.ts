import { SSTConfig } from "sst";
import { ReceivingEmail } from "./stacks/ReceivingEmail";

export default {
  config(_input) {
    return {
      name: "report-generation",
      region: "us-east-1",
    };
  },
  stacks(app) {
    app.stack(ReceivingEmail);
  },
} satisfies SSTConfig;
