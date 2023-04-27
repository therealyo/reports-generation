import { StackContext, use, Function, Cron } from "sst/constructs";
import { ReportGeneration } from "./PDFGeneration";
import { Schedule } from "aws-cdk-lib/aws-events";
import iam from "aws-cdk-lib/aws-iam";
import { Database } from "./Database";

export function SendReports({ stack }: StackContext) {
  const { pdfGeneration } = use(ReportGeneration);
  const { db } = use(Database);
  const sendEmailsLambda = new Function(stack, "cron-lambda", {
    handler: "src/sendEmail.handler",
    environment: {
      PDF_LAMBDA_NAME: pdfGeneration.functionName,
      DATABASE_SECRET: db.secret?.secretName!,
      SEND_TO: process.env.SEND_TO!,
      SOURCE_EMAIL: process.env.SOURCE_EMAIL!,
      AUTHENTICATION: process.env.AUTHENTICATION!,
      AUTHORIZATION: process.env.AUTHORIZATION!,
    },
    functionName: "send-emails-lambda",
  });
  const cron = new Cron(stack, "send-email-cron", {
    job: sendEmailsLambda,
    cdk: {
      rule: {
        schedule: Schedule.expression("cron(* * * * ? *)"),
      },
    },
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
    cron,
  };
}
