import * as cdk from "@aws-cdk/core";
import * as sfn from "@aws-cdk/aws-stepfunctions";
import * as cloudTrail from "@aws-cdk/aws-cloudtrail";
import * as s3 from "@aws-cdk/aws-s3";
import * as events from "@aws-cdk/aws-events";
import * as eventsTargets from "@aws-cdk/aws-events-targets";

export class RegularCloudTrailSelector extends cdk.Construct {
  constructor(scope: cdk.Construct, id: string) {
    super(scope, id);

    const machine = new sfn.StateMachine(this, "machine", {
      definition: new sfn.Pass(this, "pass")
    });

    const bucket = new s3.Bucket(this, "bucket", {
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    const trail = new cloudTrail.Trail(this, "trail", {
      includeGlobalServiceEvents: false,
      isMultiRegionTrail: false
    });

    trail.addS3EventSelector([{ bucket, objectPrefix: "uploads" }], {
      includeManagementEvents: false,
      readWriteType: cloudTrail.ReadWriteType.WRITE_ONLY
    });

    const assetUploadedRule = new events.Rule(this, "assetUploadedRule", {
      enabled: true,
      eventPattern: {
        source: ["aws.s3"],
        detail: {
          eventSource: ["s3.amazonaws.com"],
          eventName: ["PutObject"],
          requestParameters: {
            bucketName: [bucket.bucketName]
          }
        }
      },
      targets: [new eventsTargets.SfnStateMachine(machine)]
    });
  }
}
