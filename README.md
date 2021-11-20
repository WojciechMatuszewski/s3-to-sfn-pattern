# S3 to StepFunctions integrations

This repository contains examples of integrating _Amazon S3_ events with _AWS StepFunctions_.

There are three examples in total. Two of them leverage [_AWS CloudTrail_](https://aws.amazon.com/cloudtrail/) and [_Amazon EventBridge_](https://aws.amazon.com/eventbridge/), while the last one leverages the _AWS Lambda_ function triggered by [_Amazon S3_](https://aws.amazon.com/s3/) notification.

## Deployment

1. `npm run bootstrap`
2. `npm run deploy`

## Learnings

- To my best knowledge, there are two ways one might create such integration.

  - The **first** is to use **_S3 bucket notification_** feature that points to an _AWS Lambda_. The _AWS Lambda_ would then either **invoke _AWS StepFunctions_ directly** or **forward the event to an event bus**.
  - The **second** does not use any _AWS Lambda_ functions at all. You **create a _CloudTrail_ and use _EventSelectors_** to filter those events that you want to react to. The event will be pushed onto the default event bus automatically by _CloudTrail_.

- When it comes to pricing, **remember that _CloudTrail Data_ events are not free!**. If you wish to listen to S3 object-created related events, you will incur cost for event event delivered.

- Then **using _CloudTrail EventSelectors_** be mindful of **different predicates** that are available to you.

  - The `equals` predicate is pretty weird. I've uploaded an object to a path of `/uploads/foo.txt` but the `equals` matched on `${bucket.arn}/` path
  - I find the `startsWith` work best where you would want to filter s3 events for a given path.

- When configuring _Amazon S3_ notifications, the service will send a **test message** to validate that the subscription is setup correctly.
  I suspect that this message is send at deploy time to validate IAM permissions.
  - When configuring _AWS Lambda_ as the receiver of the event, _Amazon CloudWatch Logs_ report a strange invocation that seemingly does not invoke my handler at all. Despite having multiple `console.log` scattered through the code, all I see in the logs is `Status code: OK`. Very interesting.
  - Which component of the _AWS Lambda_ service handles that event?
    - I could not confirm or deny this. The [Nodejs RIC](https://github.com/aws/aws-lambda-nodejs-runtime-interface-client) repository does not contain any references to S3. Maybe it is the _AWS Lambda_ service job?
