import * as iam from "@aws-cdk/aws-iam";
import * as nodeJsLambda from "@aws-cdk/aws-lambda-nodejs";
import * as s3 from "@aws-cdk/aws-s3";
import * as s3Notifications from "@aws-cdk/aws-s3-notifications";
import * as sfn from "@aws-cdk/aws-stepfunctions";
import * as cdk from "@aws-cdk/core";
import * as sqs from "@aws-cdk/aws-sqs";
import * as lambdaEventSources from "@aws-cdk/aws-lambda-event-sources";
import { join } from "path";

export class S3NotificationStorageFirst extends cdk.Construct {
  constructor(scope: cdk.Construct, id: string) {
    super(scope, id);

    const machine = new sfn.StateMachine(this, "machine", {
      definition: new sfn.Pass(this, "pass")
    });

    const bucket = new s3.Bucket(this, "bucket", {
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    const s3EventsQueue = new sqs.Queue(this, "s3EventsQueue");

    const notificationHandler = new nodeJsLambda.NodejsFunction(
      this,
      "notificationHandler",
      {
        handler: "handler",
        entry: join(__dirname, "storage-first-handler.ts"),
        environment: {
          STATE_MACHINE_ARN: machine.stateMachineArn,
          QUEUE_URL: s3EventsQueue.queueUrl
        }
      }
    );
    notificationHandler.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["states:StartExecution"],
        resources: [machine.stateMachineArn],
        effect: iam.Effect.ALLOW
      })
    );
    notificationHandler.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["sqs:DeleteMessage"],
        resources: [s3EventsQueue.queueArn],
        effect: iam.Effect.ALLOW
      })
    );
    notificationHandler.addEventSource(
      new lambdaEventSources.SqsEventSource(s3EventsQueue, {
        /**
         * Increase this number as you please.
         */
        batchSize: 1,
        enabled: true
      })
    );

    bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED_PUT,
      new s3Notifications.SqsDestination(s3EventsQueue),
      { prefix: "uploads/" }
    );
  }
}
