var assert = require('assert');
var Player = require('../models/player');

var steamIdToNumericId = Player.steamIdToNumericId;
var numericIdToSteamId = Player.numericIdToSteamId;

// dy/dx
assert.ok(steamIdToNumericId('STEAM_0:0:17990207') === '76561197996246142');
assert.ok(numericIdToSteamId('76561197996246142') === 'STEAM_0:0:17990207');

// gaben
assert.ok(steamIdToNumericId('STEAM_0:0:11101') === '76561197960287930');
assert.ok(numericIdToSteamId('76561197960287930') === 'STEAM_0:0:11101');

// Some guy
assert.ok(steamIdToNumericId('STEAM_0:0:60516095') === '76561198081297918');
assert.ok(numericIdToSteamId('76561198081297918') === 'STEAM_0:0:60516095');

// Some guy
assert.ok(steamIdToNumericId('STEAM_0:1:55909089') === '76561198072083907');
assert.ok(numericIdToSteamId('76561198072083907') === 'STEAM_0:1:55909089');
