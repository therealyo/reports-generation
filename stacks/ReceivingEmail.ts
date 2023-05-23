import { StackContext, use, Function } from "sst/constructs";
import * as lambdaEventSources from "aws-cdk-lib/aws-lambda-event-sources";
import { ReceiptRuleSet } from "aws-cdk-lib/aws-ses";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as actions from "aws-cdk-lib/aws-ses-actions";
import { Database } from "./Database";
import { ReportGeneration } from "./PDFGeneration";
import iam from "aws-cdk-lib/aws-iam";
import { SendReports } from "./SendReports";

export function ReceivingEmail({ stack }: StackContext) {
  // const { vpc, secGroup, db } = use(Database);
  const { pdfGeneration } = use(ReportGeneration);
  const { sendEmailsLambda } = use(SendReports);

  const bucket = new s3.Bucket(stack, "ReportsBucket-test", {
    bucketName: process.env.BUCKET_NAME,
  });

  const lambda = new Function(stack, "bucket-handler-test", {
    handler: "src/parseEmail.handler",
    // vpc,
    // securityGroups: [secGroup],
    environment: {
      BUCKET_NAME: bucket.bucketName,
      ACCESS_KEY: process.env.ACCESS_KEY!,
      SECRET_ACCESS_KEY: process.env.SECRET_ACCESS_KEY!,
      // DATABASE_SECRET: db.secret?.secretName!,
      // DATABASE_PORT: db.dbInstanceEndpointPort,
      // DATABASE_HOST: db.dbInstanceEndpointAddress,
      EMAIL_LAMBDA_NAME: sendEmailsLambda.functionName,
      PDF_LAMBDA_NAME: pdfGeneration.functionName,
      SEND_TO: process.env.SEND_TO!,
      SOURCE_EMAIL: process.env.SOURCE_EMAIL!,
      AUTHENTICATION: process.env.AUTHENTICATION!,
      AUTHORIZATION: process.env.AUTHORIZATION!,
      SECRET_KEY: process.env.SECRET_KEY!,
      U_ENCODED: process.env.U_ENCODED!,
      P_ENCODED: process.env.P_ENCODED!,
      ORG_ENCODED: process.env.ORG_ENCODED!,
      DB_USERNAME: process.env.DB_USERNAME!,
      DB_PASSWORD: process.env.DB_PASSWORD!,
      DB_HOST: process.env.DB_HOST!,
      DB_PORT: process.env.DB_PORT!,
      DB_NAME: process.env.DB_NAME!,
    },
    functionName: "report-receiving",
    timeout: 600,
  });
  lambda.attachPermissions(["s3"]);
  lambda.attachPermissions(["secretsmanager"]);
  pdfGeneration.grantInvoke(lambda);

  lambda.addToRolePolicy(
    new iam.PolicyStatement({
      actions: ["ses:SendEmail", "SES:SendRawEmail"],
      resources: ["*"],
      effect: iam.Effect.ALLOW,
    })
  );
  // lambda.attachPermissions(["ses"])

  const s3PutEventSource = new lambdaEventSources.S3EventSource(bucket, {
    events: [s3.EventType.OBJECT_CREATED_PUT],
  });

  lambda.addEventSource(s3PutEventSource);

  const reactToReportEmail = new ReceiptRuleSet(stack, "email rule test", {
    rules: [
      {
        recipients: [process.env.DOMAIN_NAME!],
        actions: [
          new actions.S3({
            bucket,
          }),
        ],
        enabled: true,
      },
    ],
  });

  return {
    lambda,
    bucket,
    reactToReportEmail,
  };
}
