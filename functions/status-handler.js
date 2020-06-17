const zlib = require('zlib');
const rds = require('../lib/rds-lib');

const getManifestSQL = `SELECT sns_message_id, stage 
FROM sms_manifest 
WHERE sns_message_id = CAST(:sns_message_id as UUID)`;

const getManifest = (sns_message_id) => {
  return rds.run(rds.connectTo("notify_messages"), getManifestSQL, [
    { name: 'sns_message_id', value: { "stringValue": sns_message_id }}
  ]).then(data => {
    const record = data.records[0];
    return {
      sns_message_id: record[0].stringValue,
      stage: record[1].stringValue,
    };
  });
};


const updateSMSRecordSQL = `UPDATE sms
SET delivery_status = :delivery_status, 
    delivery_note = :delivery_note, 
    verified_at = :verified_at
WHERE sns_message_id = CAST(:sns_message_id as UUID)
RETURNING id, sns_message_id, delivery_status, delivery_note, to_json(verified_at)#>>'{}'`;

const updateSMSRecord = (stage, sns_message_id, delivery_status, delivery_note) => {
  const connection = rds.connectTo(`notify_${stage}`, {
    secretArn: process.env[`RDS_${stage.toUpperCase()}_ACCESS_ARN`],
    resourceArn: process.env[`RDS_${stage.toUpperCase()}_INSTANCE_ARN`]
  });
  return rds.run(connection, updateSMSRecordSQL, [
    { name: 'sns_message_id', value: { "stringValue": sns_message_id }},
    { name: 'delivery_status', value: { "stringValue": delivery_status }},
    { name: 'delivery_note', value: { "stringValue": delivery_note }},
    { name: 'verified_at', typeHint: "TIMESTAMP", value: { "stringValue": rds.now() }}
  ]).then(data => {
    const record = data.records[0];
    return {
      id: record[0].stringValue,
      sns_message_id: record[1].stringValue,
      delivery_status: record[2].stringValue,
      delivery_note: record[3].stringValue,
      verified_at: record[4].stringValue,
      stage: stage
    };
  });
};


// This is the AWS Lambda handler function. This is what AWS executes when there's a hit to this API.
const sms = (event, context) => {

  const gzip = Buffer.from(event.awslogs.data, 'base64');

  zlib.gunzip(gzip, (error, buffer) => {
    if (error) { context.fail(error); return; }

    const logsData = JSON.parse(buffer.toString('utf8'));


    logsData.logEvents.forEach(async logEvent => {
      const logMessage = JSON.parse(logEvent.message);
      const rdsResponse = await getManifest(logMessage.notification.messageId);
      const stagedRdsResponse = await updateSMSRecord(
        rdsResponse.stage, 
        rdsResponse.sns_message_id, 
        logMessage.status, 
        logMessage.delivery.providerResponse
      );

      return stagedRdsResponse;
    });
  });
};

module.exports.sms = sms