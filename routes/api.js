/*
 * Serve JSON to our AngularJS client
 */
var mongoose = require('mongoose');
var Stats = require('../models/stats');
var Match = require('../models/match');

// GET

exports.stats = function(req, res) {
  var id = req.params.id;
  // Maybe change this to findById
  Stats.findOne({ matchid: id }, function(err, stats) {
    if (err) {
      res.json(false);
    }
    else res.json({ stats: stats });
  });
};

exports.matches = function(req, res) {
  Match.find({}).sort({matchid:-1}).limit(10).exec(function(err, matches) {
    if (err) {
      res.json(false);
    }
    else {
      res.json({
        matches: matches
      });
    }
  });
};