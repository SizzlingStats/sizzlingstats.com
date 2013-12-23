var cfg = require('../cfg/cfg');
var secrets = require('../cfg/secrets');
var AWS = require('aws-sdk');

AWS.config.update({accessKeyId: secrets.aws_access_key_id, secretAccessKey: secrets.aws_secret_access_key});
AWS.config.apiVersions = {
  s3: '2006-03-01'
};
var s3 = new AWS.S3();



function stvUploadUrl (matchId) {
  var s3params = {Bucket: 'sizzlingstv', Expires: cfg.s3_upload_url_expires, Key: 'tests/' + matchId + '.zip'};
  return s3.getSignedUrl('putObject', s3params);
}


module.exports.stvUploadUrl = stvUploadUrl;
