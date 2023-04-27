import { StackContext, use, Function } from "sst/constructs";
import * as lambdaEventSources from "aws-cdk-lib/aws-lambda-event-sources";
import { ReceiptRuleSet } from "aws-cdk-lib/aws-ses";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as actions from "aws-cdk-lib/aws-ses-actions";
import { Database } from "./Database";
import { ReportGeneration } from "./PDFGeneration";
import iam from "aws-cdk-lib/aws-iam";

export function ReceivingEmail({ stack }: StackContext) {
  const { vpc, secGroup, db } = use(Database);
  const { pdfGeneration } = use(ReportGeneration);

  const bucket = new s3.Bucket(stack, "ReportsBucket", {
    bucketName: process.env.BUCKET_NAME,
  });

  const lambda = new Function(stack, "bucket-handler", {
    handler: "src/parseEmail.handler",
    vpc,
    securityGroups: [secGroup],
    environment: {
      BUCKET_NAME: bucket.bucketName,
      ACCESS_KEY: process.env.ACCESS_KEY!,
      SECRET_ACCESS_KEY: process.env.SECRET_ACCESS_KEY!,
      DATABASE_SECRET: db.secret?.secretName!,
      DATABASE_PORT: db.dbInstanceEndpointPort,
      DATABASE_HOST: db.dbInstanceEndpointAddress,
      PDF_LAMBDA_NAME: pdfGeneration.functionName,
      SEND_TO: process.env.SEND_TO!,
      SOURCE_EMAIL: process.env.SOURCE_EMAIL!,
      AUTHENTICATION: process.env.AUTHENTICATION!,
      AUTHORIZATION: process.env.AUTHORIZATION!,
    },
    functionName: "report_generation",
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

  const reactToReportEmail = new ReceiptRuleSet(stack, "email rule", {
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
