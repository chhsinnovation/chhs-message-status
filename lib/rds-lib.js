const rds = require('./aws-lib').rds;

// Format a JS Date object for insertion into PostgreSQL.
const formatDateTime = (date) => {
  return (date.toISOString().replace(/T/, ' ').replace(/\..+/, ''));
};

// Get the current time. Often useful for recording events in DB.
const now = () => {
  return formatDateTime(new Date());
};

// Default connection ARNs to AWS RDS.
const defaultConnectionParams = {
  secretArn: process.env.RDS_PROD_ACCESS_ARN,
  resourceArn: process.env.RDS_PROD_INSTANCE_ARN
};

// Helps construct params to connect to a specific database in RDS.
const connectTo = (databaseName, params = defaultConnectionParams) => ({
  ...params,
  database: databaseName
});

// Executes a SQL statement against an RDS database.
// sql is a SQL template. Parameters feed the template. 
// Works per aws-sdk specs.
// Note that it returns a promise. Handle with care!
const run = (connection, sql, parameters) => {
  const params = {
    ...connection,
    sql,
    parameters
  }
  return rds.executeStatement(params).promise();
};


module.exports.formatDateTime = formatDateTime;
module.exports.now = now;
module.exports.connectTo = connectTo;
module.exports.run = run;