module.exports =
  cfg:
    ENV: 'test'
    mongo_url: process.env.MONGO_URL || 'mongodb://localhost/sizzlingstats-test'

  secrets:
    session: 'dummy'
    steamapi: 'dummy'
    aws_access_key_id: 'dummy'
    aws_secret_access_key: 'dummy'
