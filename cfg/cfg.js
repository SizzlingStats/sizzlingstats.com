var cfg = {
  hostname: (process.env.HOSTNAME || 'http://sizzlingstats.com/'),
  port: parseInt(process.env.PORT, 10) || 8001,
  mongo_url: process.env.MONGO_URL || process.env.MONGOHQ_URL || 'mongodb://localhost/sizzlingstats',
  // Stats Sessions are valid for only 30 minutes since last update
  stats_session_timeout: 30*60*1000,
  // Check for sessions to expire every 15 minutes
  session_expiry_interval: 15
};

module.exports = cfg;
