import { aws_rds } from "aws-cdk-lib";
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
  const vpc = new Vpc(stack, "database-vpc", {
    maxAzs: 3,
    subnetConfiguration: [
      {
        name: "public-db",
        subnetType: SubnetType.PUBLIC,
        cidrMask: 24,
      },
      {
        name: "private",
        subnetType: SubnetType.PRIVATE_WITH_EGRESS,
        cidrMask: 24,
      },
    ],
  });

  const secGroup = new SecurityGroup(
    stack,
    "allow_database_connection_from_internet",
    {
      vpc: vpc,
    }
  );
  secGroup.addIngressRule(Peer.ipv4("0.0.0.0/0"), Port.tcp(5432));

  const db = new aws_rds.DatabaseInstance(stack, "reports-database", {
    engine: aws_rds.DatabaseInstanceEngine.postgres({
      version: aws_rds.PostgresEngineVersion.VER_14_1,
    }),
    publiclyAccessible: true,
    instanceType: InstanceType.of(InstanceClass.BURSTABLE3, InstanceSize.MICRO),
    vpc: vpc,
    vpcSubnets: {
      subnets: vpc.publicSubnets,
    },
    securityGroups: [secGroup],
    databaseName: "reports",
    storageEncrypted: false,
  });
  db.connections.allowDefaultPortFromAnyIpv4();

  return {
    db,
    vpc,
    secGroup,
  };
}
