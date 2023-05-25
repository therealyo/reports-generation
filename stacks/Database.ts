import { aws_rds } from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";

import { SecurityGroup, Vpc } from "aws-cdk-lib/aws-ec2";
import { StackContext } from "sst/constructs";

export function Database({ stack }: StackContext) {
  const vpc = new Vpc(stack, "database-vpc", {
    cidr: "10.0.0.0/16",
    maxAzs: 2,
    subnetConfiguration: [
      {
        cidrMask: 24,
        name: "PublicSubnet",
        subnetType: ec2.SubnetType.PUBLIC,
      },
    ],
  });

  const secGroup = new SecurityGroup(
    stack,
    "allow_database_connection_from_internet",
    {
      vpc,
      securityGroupName: "samuel-sec-group",
    }
  );

  secGroup.addEgressRule(ec2.Peer.anyIpv4(), ec2.Port.allTraffic());
  secGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(5432));

  const db = new aws_rds.DatabaseInstance(stack, "reports-database", {
    engine: aws_rds.DatabaseInstanceEngine.postgres({
      version: aws_rds.PostgresEngineVersion.VER_14_2,
    }),
    vpc,
    securityGroups: [secGroup],
    instanceType: ec2.InstanceType.of(
      ec2.InstanceClass.BURSTABLE3,
      ec2.InstanceSize.MICRO
    ),
    allocatedStorage: 100,
    storageType: aws_rds.StorageType.GP2,
    databaseName: "reports",
    vpcSubnets: {
      subnetType: ec2.SubnetType.PUBLIC,
    },
    publiclyAccessible: true,
  });
  db.connections.allowDefaultPortFromAnyIpv4();

  return {
    db,
    vpc,
    secGroup,
  };
}
