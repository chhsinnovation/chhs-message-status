-- Uncomment this for actual execution.
-- Just commenting it out to stop VS Code from bugging out.
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

create TABLE sms_manifest (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  sns_message_id uuid NOT NULL,
  stage varchar (10) NOT NULL
);

CREATE INDEX index_sms_manifest_sns_message_id ON sms_manifest(sns_message_id);