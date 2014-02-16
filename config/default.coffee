cfg =
  ENV: process.env.NODE_ENV || 'development'
  dev: process.env.NODE_ENV != 'production'

  address: process.env.ADDRESS
  port: parseInt(process.env.PORT, 10) || 8001
  socket_io_address: process.env.SOCKET_IO_ADDRESS
  mongo_url: process.env.MONGO_URL || process.env.MONGOHQ_URL ||
                                      'mongodb://localhost/sizzlingstats'
  elasticsearch_url: process.env.ELASTICSEARCH_URL ||
                     'http://localhost:9200/sizzlingstats'
  airbrake_host: 'sizzlingerrbit.herokuapp.com'
  # Redis Info
  redis_host: process.env.REDIS_HOST || '127.0.0.1'
  redis_port: parseInt(process.env.REDIS_PORT, 10) || 6379
  redis_db: parseInt(process.env.REDIS_DB, 10) || 2
  redis_password: process.env.REDIS_PASSWORD
  session_prefix: (process.env.SESSION_PREFIX) || 'ss_sess'
  # Stats Sessions are valid for only 1 hour since last update
  stats_session_timeout: 1*60*60*1000
  # Check for stat-sessions to expire every 20 minutes
  session_expiry_interval: 20
  #   How long to wait before refreshing steam API info for a player - 1 week
  # (country, avatar url, steam profile name)
  player_metadata_cache_length: 7*24*60*60*1000
  # 3*60*60 == 3 hours (unit is in seconds)
  s3_upload_url_expires: 3*60*60


if !cfg.address
  if cfg.dev
    cfg.address = 'http://localhost:' + cfg.port
  else
    cfg.address = 'http://sizzlingstats.com'

if cfg.dev
  cfg.socket_io_address = cfg.socket_io_address || 'http://localhost'
else
  cfg.socket_io_address = cfg.socket_io_address || 'http://ws.sizzlingstats.com'


module.exports =
  cfg: cfg
  secrets: require('./secrets')
