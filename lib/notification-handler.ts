import { SFNClient, StartExecutionCommand } from "@aws-sdk/client-sfn";
import { S3Handler } from "aws-lambda";

const sfnClient = new SFNClient({});

export const handler: S3Handler = async event => {
  console.log(event);

  const [record] = event.Records;

  const result = await sfnClient.send(
    new StartExecutionCommand({
      stateMachineArn: process.env.STATE_MACHINE_ARN as string,
      input: JSON.stringify(record)
    })
  );

  console.log(result);
};
