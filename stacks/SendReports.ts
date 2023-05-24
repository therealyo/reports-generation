import { StackContext, use, Function, Cron } from "sst/constructs";
import { ReportGeneration } from "./PDFGeneration";
import iam from "aws-cdk-lib/aws-iam";
import { Database } from "./Database";

export function SendReports({ stack }: StackContext) {
  const { pdfGeneration } = use(ReportGeneration);
  const { db } = use(Database);
  const sendEmailsLambda = new Function(stack, "send-emails-lambda", {
    handler: "src/sendEmail.handler",
    environment: {
      PDF_LAMBDA_NAME: pdfGeneration.functionName,
      DATABASE_SECRET: db.secret?.secretName!,
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
    functionName: "send-emails-lambda",
    timeout: 600,
  });
  // const cron = new Cron(stack, "send-email-cron-test", {
  //   job: sendEmailsLambda,
  //   cdk: {
  //     rule: {
  //       schedule: Schedule.expression("cron(0 2 * * ? *)"),
  //     },
  //   },
  // });

  // cron.attachPermissions(["lambda"]);
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
    // cron,
    sendEmailsLambda,
  };
}
