import { StackContext, Api, Function, use } from "sst/constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { ReceivingEmail } from "./ReceivingEmail";

export function ReportGeneration({ stack }: StackContext) {
  // const { mainLambda } = use(ReceivingEmail);
  const pdfGeneration = new Function(stack, "pdf-generation-test", {
    handler: "src/pdfGeneration.handler",
    layers: [
      lambda.LayerVersion.fromLayerVersionArn(
        stack,
        "pdf-layer",
        process.env.LAMBDA_LAYER_ARN!
      ),
    ],
    nodejs: {
      install: ["@sparticuz/chromium", "puppeteer-core"],
    },
    runtime: "nodejs16.x",
    functionName: "pdf-generation-from-html-test",
  });

  return {
    pdfGeneration,
  };
}
