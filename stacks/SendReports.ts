import { StackContext, use, Function } from "sst/constructs";
import { ReportGeneration } from "./PDFGeneration";
import iam from "aws-cdk-lib/aws-iam";
import { Database } from "./Database";

export function SendReports({ stack }: StackContext) {
  const { pdfGeneration } = use(ReportGeneration);
  const { db } = use(Database);
  const sendEmailsLambda = new Function(stack, "send-emails-handler", {
    handler: "src/sendEmail.handler",
    environment: {
      PDF_LAMBDA_NAME: pdfGeneration.functionName,
      DATABASE_SECRET: db.secret?.secretName!,
      GOOGLE_API_KEY: process.env.GOOGLE_API_KEY!,
      SEND_TO: process.env.SEND_TO!,
      SOURCE_EMAIL: process.env.SOURCE_EMAIL!,
      AUTHENTICATION: process.env.AUTHENTICATION!,
      AUTHORIZATION: process.env.AUTHORIZATION!,
      DB_USERNAME: process.env.DB_USERNAME!,
      DB_PASSWORD: process.env.DB_PASSWORD!,
      DB_HOST: process.env.DB_HOST!,
      DB_PORT: process.env.DB_PORT!,
      DB_NAME: process.env.DB_NAME!,
    },
    functionName: "send-emails",
    timeout: 600,
  });

  sendEmailsLambda.addToRolePolicy(
    new iam.PolicyStatement({
      actions: ["ses:SendEmail", "SES:SendRawEmail"],
      resources: ["*"],
      effect: iam.Effect.ALLOW,
    })
  );
  sendEmailsLambda.attachPermissions(["secretsmanager"]);

  pdfGeneration.grantInvoke(sendEmailsLambda);

  return {
    sendEmailsLambda,
  };
}
