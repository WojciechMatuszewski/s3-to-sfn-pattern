import * as cloudTrail from "@aws-cdk/aws-cloudtrail";
import * as events from "@aws-cdk/aws-events";
import * as eventsTargets from "@aws-cdk/aws-events-targets";
import * as s3 from "@aws-cdk/aws-s3";
import * as sfn from "@aws-cdk/aws-stepfunctions";
import * as cdk from "@aws-cdk/core";
import * as customResources from "@aws-cdk/custom-resources";

export class AdvancedCloudTrailSelector extends cdk.Construct {
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
    const cfnTrail = trail.node.defaultChild as cloudTrail.CfnTrail;

    const advancedEventSelectorResource = new customResources.AwsCustomResource(
      this,
      "advancedEventSelectorResource",
      {
        onCreate: {
          action: "putEventSelectors",
          service: "CloudTrail",
          parameters: {
            AdvancedEventSelectors: [
              {
                FieldSelectors: [
                  { Field: "eventCategory", Equals: ["Data"] },
                  { Field: "resources.type", Equals: ["AWS::S3::Object"] },
                  { Field: "eventName", Equals: ["PutObject"] },
                  {
                    Field: "resources.ARN",
                    StartsWith: [bucket.arnForObjects("uploads/")]
                  }
                ],
                Name: "Listens to the PutObject only"
              }
            ],
            TrailName: cfnTrail.ref
          },
          physicalResourceId:
            customResources.PhysicalResourceId.fromResponse("TrailARN")
        },
        onDelete: {
          action: "putEventSelectors",
          service: "CloudTrail",
          parameters: {
            AdvancedSelectors: [],
            TrailName: cfnTrail.ref
          }
        },
        policy: customResources.AwsCustomResourcePolicy.fromSdkCalls({
          resources: [trail.trailArn]
        })
      }
    );

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
