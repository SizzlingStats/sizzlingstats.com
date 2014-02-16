module.exports =
  cfg:
    ENV: 'production'

    port: +process.env.PORT || 8001
    address: process.env.ADDRESS || 'http://sizzlingstats.com'
    socket_io_address: process.env.SOCKET_IO_ADDRESS || 'http://ws.sizzlingstats.com'

    mongo_url: process.env.MONGO_URL || 'mongodb://localhost/sizzlingstats'
    elasticsearch_url: process.env.ELASTICSEARCH_URL || 'http://localhost:9200/sizzlingstats'

    s3_stv_key: 'stv/'

    airbrake_host: 'sizzlingerrbit.herokuapp.com'

    devScripts: []


  secrets: require('./secrets')
