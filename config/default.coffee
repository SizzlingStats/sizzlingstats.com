port = +process.env.PORT || 8001

module.exports =
  cfg:
    port: port
    address: process.env.ADDRESS || 'http://localhost:' + port
    socket_io_address: process.env.SOCKET_IO_ADDRESS || 'http://localhost'
    socket_io_port: process.env.SOCKET_IO_PORT || port

    mongo_url: process.env.MONGO_URL || 'mongodb://localhost/sizzlingstats'

    elasticsearch_url: process.env.ELASTICSEARCH_URL || 'http://localhost:9200/sizzlingstats'

    # Redis Info
    redis_host: process.env.REDIS_HOST || '127.0.0.1'
    redis_port: +process.env.REDIS_PORT || 6379
    redis_db: +process.env.REDIS_DB || 2
    redis_password: process.env.REDIS_PASSWORD

    session_prefix: (process.env.SESSION_PREFIX) || 'ss_sess'
    # Stats Sessions are valid for only 1 hour since last update
    stats_session_timeout: 1*60*60*1000
    # Check for stat-sessions to expire every 20 minutes
    session_expiry_interval: 20
    #   How long to wait before refreshing steam API info for a player - 1 week
    # (country, avatar url, steam profile name)
    player_metadata_cache_length: 7*24*60*60*1000

    s3_stv_bucket: 'sizzlingstv'
    s3_stv_key: 'tests/'
    # 3*60*60 == 3 hours (unit is in seconds)
    s3_upload_url_expires: 3*60*60

    devScripts: [
      # order matters here
      'lib/jquery/jquery-2.1.0.js'
      'lib/angular/angular.js'
      'lib/angular/angular-route.js'
    ]
