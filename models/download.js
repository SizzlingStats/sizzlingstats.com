var mongoose = require('mongoose');

// This is a model for tracking downloads (like ss builds)

var downloadSchema = new mongoose.Schema({
  _id: { type: String, required: true }
, downloadCount: Number
});

var Download = mongoose.model('Download', downloadSchema);

module.exports = Download;
