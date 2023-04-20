import { StackContext, Api, Bucket, Function } from "sst/constructs";
import { LambdaDestination } from "aws-cdk-lib/aws-s3-notifications";
import * as lambdaEventSources from "aws-cdk-lib/aws-lambda-event-sources";
import { ReceiptRuleSet } from "aws-cdk-lib/aws-ses";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as actions from "aws-cdk-lib/aws-ses-actions";

export function ReceivingEmail({ stack }: StackContext) {
  const lambda = new Function(stack, "bucket-handler", {
    handler: "src/index.handler",
  });

  const bucket = new s3.Bucket(stack, "ReportsBucket", {
    bucketName: "samuel-reports-bucket-lambda-test-2",
  });

  lambda.attachPermissions(["s3"]);

  // bucket.addObjectCreatedNotification(new LambdaDestination(lambda));

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
