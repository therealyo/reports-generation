import { StackContext, use, Function } from "sst/constructs";
import * as lambdaEventSources from "aws-cdk-lib/aws-lambda-event-sources";
import { ReceiptRuleSet } from "aws-cdk-lib/aws-ses";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as actions from "aws-cdk-lib/aws-ses-actions";
import { Database } from "./Database";

export function ReceivingEmail({ stack }: StackContext) {
  const { vpc, secGroup, db } = use(Database);

  const bucket = new s3.Bucket(stack, "ReportsBucket", {
    bucketName: "samuel-reports-bucket-lambda-test-2",
  });

  const lambda = new Function(stack, "bucket-handler", {
    handler: "src/index.handler",
    vpc,
    securityGroups: [secGroup],
    environment: {
      BUCKET_NAME: bucket.bucketName,
      ACCESS_KEY: process.env.ACCESS_KEY!,
      SECRET_ACCESS_KEY: process.env.SECRET_ACCESS_KEY!,
      DATABASE_SECRET: db.secret?.secretName!,
      DATABASE_PORT: db.dbInstanceEndpointPort,
      DATABASE_HOST: db.dbInstanceEndpointAddress,
    },
  });
  lambda.attachPermissions(["s3"]);
  lambda.attachPermissions(["secretsmanager"]);

  const s3PutEventSource = new lambdaEventSources.S3EventSource(bucket, {
    events: [s3.EventType.OBJECT_CREATED_PUT],
  });

  lambda.addEventSource(s3PutEventSource);

  const reactToReportEmail = new ReceiptRuleSet(stack, "email rule", {
    rules: [
      {
        recipients: ["lambda-dev.website"],
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
