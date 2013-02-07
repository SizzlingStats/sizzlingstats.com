var cfg = {
  hostname: (process.env.HOSTNAME || 'http://sizzlingstats.com')
, port: parseInt(process.env.PORT, 10) || 8001
, mongo_url: process.env.MONGO_URL || process.env.MONGOHQ_URL || 'mongodb://localhost/sizzlingstats'
  // Redis Info
, redis_host: process.env.REDIS_HOST || '127.0.0.1'
, redis_port: parseInt(process.env.REDIS_PORT, 10) || 6379
, redis_db: parseInt(process.env.REDIS_DB, 10) || 2
, redis_password: process.env.REDIS_PASSWORD
  // Stats Sessions are valid for only 30 minutes since last update
, stats_session_timeout: 30*60*1000
  // Check for sessions to expire every 15 minutes
, session_expiry_interval: 15
};

module.exports = cfg;
