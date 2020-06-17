# Notify Message Status

Because SMS messages from all stages (dev, prod, etc.) of the [chhs-notify](https://github.com/chhsinnovation/chhs-notify) are all sent through the same AWS SNS service, we need a way to make sense of which messages have been sent from which instances. This separate set of Lambda functions exists as overwatch to check and delegate message delivery status across all stages of chhs-notify.

## SMS Logging

To make SMS status checks work, you need to do some manual stuff.

1. Go into AWS SNS and enable logging to AWS CloudWatch Logs. [Instructions](https://docs.aws.amazon.com/sns/latest/dg/sms_stats_cloudwatch.html). Note that you may need to wait a bit or send several text messages before this change becomes visible in CloudWatch.

2. Deploy this NotifyMessageStatus set of services to AWS Lambda via the usual `serverless deploy` command.

3. Go to AWS CloudWatch Logs and find the relevant Log Streams. You'll likely see two, one for success (such as *DirectPublishToPhoneNumber*) and another for failures (like *DirectPublishToPhoneNumber/Failure*). Use the `Actions` menu to subscribe each to `Stream to AWS Lambda`. Wire up the relevant Lambda functions for each when prompted; pick `JSON` as the log format.