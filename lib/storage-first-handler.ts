import { SQSHandler } from "aws-lambda";
import { SFNClient, StartExecutionCommand } from "@aws-sdk/client-sfn";
import { SQSClient, DeleteMessageCommand } from "@aws-sdk/client-sqs";

const sfnClient = new SFNClient({});
const sqsClient = new SQSClient({});

export const handler: SQSHandler = async event => {
  console.log(event);

  /**
   * Always remember to delete messages manually!
   * If we do not, when function fails, the whole batch would be re-queued.
   */
  const promises = event.Records.map(async record => {
    await sfnClient.send(
      new StartExecutionCommand({
        stateMachineArn: process.env.STATE_MACHINE_ARN as string,
        input: record.body
      })
    );
    /**
     * One might use `deleteBatch` to delete multiple messages at once.
     */
    await sqsClient.send(
      new DeleteMessageCommand({
        QueueUrl: process.env.QUEUE_URL,
        ReceiptHandle: record.receiptHandle
      })
    );
  });

  const result = await Promise.allSettled(promises);

  const hasFailedRecords = result.some(
    startExecutionResult => startExecutionResult.status === "rejected"
  );
  if (hasFailedRecords) {
    throw new Error("One or more records failed to process");
  }
};
