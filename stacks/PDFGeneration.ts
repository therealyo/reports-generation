import { StackContext, Function } from "sst/constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";

export function ReportGeneration({ stack }: StackContext) {
  const pdfGeneration = new Function(stack, "pdf-generation-lambda", {
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
    functionName: "generate-pdf-from-html",
  });

  return {
    pdfGeneration,
  };
}
