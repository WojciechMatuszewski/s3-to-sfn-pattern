import * as cdk from "@aws-cdk/core";
import * as sfn from "@aws-cdk/aws-stepfunctions";
import * as cloudTrail from "@aws-cdk/aws-cloudtrail";
import * as s3 from "@aws-cdk/aws-s3";
import * as events from "@aws-cdk/aws-events";
import * as eventsTargets from "@aws-cdk/aws-events-targets";
import { RegularCloudTrailSelector } from "./regular-cloudtrail-selector";
import { AdvancedCloudTrailSelector } from "./advanced-cloudtrail-selector";
import { S3NotificationLambda } from "./s3-notification-lambda";

export class CodeStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new RegularCloudTrailSelector(this, "regularEventSelector");
    new AdvancedCloudTrailSelector(this, "advancedEventSelector");
    new S3NotificationLambda(this, "s3NotificationLambda");
  }
}
