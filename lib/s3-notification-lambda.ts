import * as iam from "@aws-cdk/aws-iam";
import * as nodeJsLambda from "@aws-cdk/aws-lambda-nodejs";
import * as s3 from "@aws-cdk/aws-s3";
import * as s3Notifications from "@aws-cdk/aws-s3-notifications";
import * as sfn from "@aws-cdk/aws-stepfunctions";
import * as cdk from "@aws-cdk/core";
import { join } from "path";

export class S3NotificationLambda extends cdk.Construct {
  constructor(scope: cdk.Construct, id: string) {
    super(scope, id);

    const machine = new sfn.StateMachine(this, "machine", {
      definition: new sfn.Pass(this, "pass")
    });

    const bucket = new s3.Bucket(this, "bucket", {
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    /**
     * Handler is responsible for forwarding the S3 event to the state machine.
     */
    const notificationHandler = new nodeJsLambda.NodejsFunction(
      this,
      "notificationHandler",
      {
        handler: "handler",
        entry: join(__dirname, "notification-handler.ts"),
        environment: {
          STATE_MACHINE_ARN: machine.stateMachineArn
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

    bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED_PUT,
      new s3Notifications.LambdaDestination(notificationHandler),
      { prefix: "uploads/" }
    );
  }
}
