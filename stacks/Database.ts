import { aws_rds } from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";

import {
  InstanceClass,
  InstanceSize,
  InstanceType,
  Peer,
  Port,
  SecurityGroup,
  SubnetType,
  Vpc,
} from "aws-cdk-lib/aws-ec2";
import { StackContext } from "sst/constructs";

export function Database({ stack }: StackContext) {
  const vpc = new Vpc(stack, "database-vpc-test", {
    maxAzs: 3,
  });

  const secGroup = new SecurityGroup(
    stack,
    "allow_database_connection_from_internet-test",
    {
      vpc: vpc,
    }
  );
  secGroup.addIngressRule(Peer.ipv4("0.0.0.0/0"), Port.tcp(5432));

  const db = new aws_rds.DatabaseInstance(stack, "reports-database-test", {
    engine: aws_rds.DatabaseInstanceEngine.postgres({
      version: aws_rds.PostgresEngineVersion.VER_14_2,
    }),
    publiclyAccessible: true,
    instanceType: InstanceType.of(InstanceClass.BURSTABLE3, InstanceSize.MICRO),
    vpc: vpc,
    vpcSubnets: {
      subnetType: ec2.SubnetType.PUBLIC,
    },
    securityGroups: [secGroup],
    databaseName: "reports",
    storageEncrypted: false,
  });
  db.connections.allowDefaultPortFromAnyIpv4();
  console.log(db.secret!.secretName);

  return {
    db,
    vpc,
    secGroup,
  };
}
