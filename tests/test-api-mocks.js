/**
 * tests/test-api-mocks.js
 * Mock request data
 */

    // 0 -> 0
    // 1 -> 1 Scout
    // 2 -> 8 Sniper
    // 3 -> 2 Soldier
    // 4 -> 4 Demoman
    // 5 -> 7 Medic
    // 6 -> 5 Heavy
    // 7 -> 3 Pyro
    // 8 -> 9 Spy
    // 9 -> 6 Engineer

    // PLAYED_SCOUT    = 1<<0; //   1          1  should be:          1
    // PLAYED_SNIPER   = 1<<1; //   2         10  should be:   10000000
    // PLAYED_SOLDIER  = 1<<2; //   4        100  should be:         10
    // PLAYED_DEMOMAN  = 1<<3; //   8       1000  should be:       1000
    // PLAYED_MEDIC    = 1<<4; //  16      10000  should be:    1000000
    // PLAYED_HEAVY    = 1<<5; //  32     100000  should be:      10000
    // PLAYED_PYRO     = 1<<6; //  64    1000000  should be:        100
    // PLAYED_SPY      = 1<<7; // 128   10000000  should be:  100000000
    // PLAYED_ENGINEER = 1<<8; // 256  100000000  should be:     100000

module.exports = {

  /**
   * Test 1: Mock createStats
   */

  statsHeaders1: {
    "sizzlingstats": "v0.1"
  , "apikey": "05c5a8c9-75af-4761-9329-2ebddab41f15"
  }

, statsBody1: {"stats": {
    "map": "cp_badlands"
  , "hostname": "mocks r0"
  , "bluname": "BluName"
  , "redname": "RedName"
  , "players": [
      {"steamid": "STEAM_0:0:86144",    "team": 2, "name": "Cigar",       "mostplayedclass": 1}
    , {"steamid": "STEAM_0:1:17260233", "team": 3, "name": "SteveC",      "mostplayedclass": 1}
    , {"steamid": "STEAM_0:1:16097990", "team": 2, "name": "foster",      "mostplayedclass": 1}
    , {"steamid": "STEAM_0:0:7422703",  "team": 3, "name": "binarystar!", "mostplayedclass": 1}
    , {"steamid": "STEAM_0:0:17990207", "team": 2, "name": "dy<br>dx",    "mostplayedclass": 3}
    , {"steamid": "STEAM_0:1:11029950", "team": 3, "name": "rando",       "mostplayedclass": 3}
    , {"steamid": "STEAM_0:0:14353663", "team": 2, "name": "Sizzling",    "mostplayedclass": 3}
    , {"steamid": "STEAM_0:1:9607258",  "team": 3, "name": "Dave__AC",    "mostplayedclass": 3}
    , {"steamid": "STEAM_0:1:19111546", "team": 2, "name": "drdonutman",  "mostplayedclass": 4}
    , {"steamid": "STEAM_0:0:21274546", "team": 3, "name": "Gobiner",     "mostplayedclass": 4}
    , {"steamid": "STEAM_0:0:9038326",  "team": 2, "name": "Trekkie",     "mostplayedclass": 5}
    , {"steamid": "STEAM_0:0:5486374",  "team": 3, "name": "eXtine",      "mostplayedclass": 5}
    // , {"steamid": "STEAM_0:1:19550627", "team": 3, "name": "Jay",         "mostplayedclass": 5}
    ]
  }}

  /**
   * Test 2: Mock updateStats, endofround=false
   */

, statsHeaders2: {
    "sizzlingstats": "v0.1"
  , "endofround": "false"
  , "sessionid": "something"
  }

, statsBody2: {"stats": {
    "map": "YouShouldNotSeeThis"
  , "hostname": "YouShouldNotSeeThis"
  , "bluname": "YouShouldNotSeeThis"
  , "redname": "YouShouldNotSeeThis"
  , "bluscore": 0
  , "redscore": 0
  , "roundduration": 100
  , "players": [
      {"steamid": "STEAM_0:0:86144",    "team": 2, "name": "Cigar",       "mostplayedclass": 1, "playedclasses": 0,   "kills": 0, "deaths":2}
    , {"steamid": "STEAM_0:1:17260233", "team": 3, "name": "SteveC",      "mostplayedclass": 1, "playedclasses": 3,   "kills": 0, "deaths":8}
    , {"steamid": "STEAM_0:1:16097990", "team": 2, "name": "foster",      "mostplayedclass": 1, "playedclasses": 1,   "kills": 2, "deaths":4}
    , {"steamid": "STEAM_0:0:7422703",  "team": 3, "name": "binarystar!", "mostplayedclass": 1, "playedclasses": 35,  "kills": 9, "deaths":9}
    , {"steamid": "STEAM_0:0:17990207", "team": 2, "name": "dy<br>dx",    "mostplayedclass": 3, "playedclasses": 4,   "kills": 8, "deaths":4}
    , {"steamid": "STEAM_0:1:11029950", "team": 3, "name": "rando",       "mostplayedclass": 3, "playedclasses": 4,   "kills": 4, "deaths":2}
    , {"steamid": "STEAM_0:0:14353663", "team": 2, "name": "Sizzling",    "mostplayedclass": 3, "playedclasses": 4,   "kills": 2, "deaths":2}
    , {"steamid": "STEAM_0:1:9607258",  "team": 3, "name": "Dave__AC",    "mostplayedclass": 3, "playedclasses": 4,   "kills": 1, "deaths":4}
    , {"steamid": "STEAM_0:1:19111546", "team": 2, "name": "drdonutman",  "mostplayedclass": 4, "playedclasses": 8,   "kills": 1, "deaths":5}
    , {"steamid": "STEAM_0:0:21274546", "team": 3, "name": "Gobiner",     "mostplayedclass": 4, "playedclasses": 323, "kills": 3, "deaths":1}
    , {"steamid": "STEAM_0:0:9038326",  "team": 2, "name": "Trekkie",     "mostplayedclass": 5, "playedclasses": 16,  "kills": 4, "deaths":6}
    , {"steamid": "STEAM_0:0:5486374",  "team": 3, "name": "eXtine",      "mostplayedclass": 5, "playedclasses": 16,  "kills": 7, "deaths":1}
    // , {"steamid": "STEAM_0:1:19550627", "team": 3, "name": "Jay",         "mostplayedclass": 5, "playedclasses": 16,  "kills": 3, "deaths":0}
    ]
  }}

  /**
   * Test 3: Mock updateStats, endofround=false, new player added (Jay)
   */

, statsHeaders3: {
    "sizzlingstats": "v0.1"
  , "endofround": "false"
  , "sessionid": "something"
  }

, statsBody3: {"stats": {
    "map": "YouShouldNotSeeThis"
  , "hostname": "YouShouldNotSeeThis"
  , "bluname": "YouShouldNotSeeThis"
  , "redname": "YouShouldNotSeeThis"
  , "bluscore": 0
  , "redscore": 0
  , "teamfirstcap": 3
  , "roundduration": 120
  , "players": [
      {"steamid": "STEAM_0:0:86144",    "team": 2, "name": "Cigar",       "mostplayedclass": 1, "playedclasses": 0,   "kills": 0, "deaths":2}
    , {"steamid": "STEAM_0:1:17260233", "team": 3, "name": "SteveC",      "mostplayedclass": 1, "playedclasses": 3,   "kills": 0, "deaths":8}
    , {"steamid": "STEAM_0:1:16097990", "team": 2, "name": "foster",      "mostplayedclass": 1, "playedclasses": 1,   "kills": 2, "deaths":4}
    , {"steamid": "STEAM_0:0:7422703",  "team": 3, "name": "binarystar!", "mostplayedclass": 1, "playedclasses": 35,  "kills": 9, "deaths":9}
    , {"steamid": "STEAM_0:0:17990207", "team": 2, "name": "dy<br>dx",    "mostplayedclass": 3, "playedclasses": 4,   "kills": 8, "deaths":4}
    , {"steamid": "STEAM_0:1:11029950", "team": 3, "name": "rando",       "mostplayedclass": 3, "playedclasses": 4,   "kills": 4, "deaths":2}
    , {"steamid": "STEAM_0:0:14353663", "team": 2, "name": "Sizzling",    "mostplayedclass": 3, "playedclasses": 4,   "kills": 2, "deaths":2}
    , {"steamid": "STEAM_0:1:9607258",  "team": 3, "name": "Dave__AC",    "mostplayedclass": 3, "playedclasses": 4,   "kills": 1, "deaths":4}
    , {"steamid": "STEAM_0:1:19111546", "team": 2, "name": "drdonutman",  "mostplayedclass": 4, "playedclasses": 8,   "kills": 1, "deaths":5}
    , {"steamid": "STEAM_0:0:21274546", "team": 3, "name": "Gobiner",     "mostplayedclass": 4, "playedclasses": 323, "kills": 3, "deaths":1}
    , {"steamid": "STEAM_0:0:9038326",  "team": 2, "name": "Trekkie",     "mostplayedclass": 5, "playedclasses": 16,  "kills": 4, "deaths":6}
    , {"steamid": "STEAM_0:0:5486374",  "team": 3, "name": "eXtine",      "mostplayedclass": 5, "playedclasses": 16,  "kills": 7, "deaths":1}
    , {"steamid": "STEAM_0:1:19550627", "team": 3, "name": "Jay",         "mostplayedclass": 5, "playedclasses": 16,  "kills": 3, "deaths":0}
    ]
  }}

  /**
   * Test 4: Mock updateStats, endofround=true
   */

, statsHeaders4: {
    "sizzlingstats": "v0.1"
  , "endofround": "true"
  , "sessionid": "something"
  }

, statsBody4: {"stats": {
    "map": "YouShouldNotSeeThis"
  , "hostname": "YouShouldNotSeeThis"
  , "bluname": "YouShouldNotSeeThis"
  , "redname": "YouShouldNotSeeThis"
  , "bluscore": 0
  , "redscore": 1
  , "teamfirstcap": 3
  , "roundduration": 160
  , "players": [
      {"steamid": "STEAM_0:0:86144",    "team": 2, "name": "Cigar",       "mostplayedclass": 1, "playedclasses": 0,   "kills": 0, "deaths":2}
    , {"steamid": "STEAM_0:1:17260233", "team": 3, "name": "SteveC",      "mostplayedclass": 1, "playedclasses": 3,   "kills": 0, "deaths":8}
    , {"steamid": "STEAM_0:1:16097990", "team": 2, "name": "foster",      "mostplayedclass": 1, "playedclasses": 1,   "kills": 2, "deaths":4}
    , {"steamid": "STEAM_0:0:7422703",  "team": 3, "name": "binarystar!", "mostplayedclass": 1, "playedclasses": 35,  "kills": 9, "deaths":9}
    , {"steamid": "STEAM_0:0:17990207", "team": 2, "name": "dy<br>dx",    "mostplayedclass": 3, "playedclasses": 4,   "kills": 8, "deaths":4}
    , {"steamid": "STEAM_0:1:11029950", "team": 3, "name": "rando",       "mostplayedclass": 3, "playedclasses": 4,   "kills": 4, "deaths":2}
    , {"steamid": "STEAM_0:0:14353663", "team": 2, "name": "Sizzling",    "mostplayedclass": 3, "playedclasses": 4,   "kills": 2, "deaths":2}
    , {"steamid": "STEAM_0:1:9607258",  "team": 3, "name": "Dave__AC",    "mostplayedclass": 3, "playedclasses": 4,   "kills": 1, "deaths":4}
    , {"steamid": "STEAM_0:1:19111546", "team": 2, "name": "drdonutman",  "mostplayedclass": 4, "playedclasses": 8,   "kills": 1, "deaths":5}
    , {"steamid": "STEAM_0:0:21274546", "team": 3, "name": "Gobiner",     "mostplayedclass": 4, "playedclasses": 323, "kills": 3, "deaths":1}
    , {"steamid": "STEAM_0:0:9038326",  "team": 2, "name": "Trekkie",     "mostplayedclass": 5, "playedclasses": 16,  "kills": 4, "deaths":6}
    , {"steamid": "STEAM_0:0:5486374",  "team": 3, "name": "eXtine",      "mostplayedclass": 5, "playedclasses": 16,  "kills": 7, "deaths":1}
    // , {"steamid": "STEAM_0:1:19550627", "team": 3, "name": "Jay",         "mostplayedclass": 5, "playedclasses": 16,  "kills": 3, "deaths":0}
    ]
  }}

  /**
   * Test 5: Mock updateStats, endofround=true, new player added (b4nny)
   */

, statsHeaders5: {
    "sizzlingstats": "v0.1"
  , "endofround": "true"
  , "sessionid": "something"
  }

, statsBody5: {"stats": {
    "map": "YouShouldNotSeeThis"
  , "hostname": "YouShouldNotSeeThis"
  , "bluname": "YouShouldNotSeeThis"
  , "redname": "YouShouldNotSeeThis"
  , "bluscore": 1
  , "redscore": 0
  , "teamfirstcap": 2
  , "roundduration": 160
  , "players": [
      {"steamid": "STEAM_0:0:86144",    "team": 2, "name": "Cigar",       "mostplayedclass": 1, "playedclasses": 0,   "kills": 0, "deaths":2}
    , {"steamid": "STEAM_0:1:17260233", "team": 3, "name": "SteveC",      "mostplayedclass": 1, "playedclasses": 3,   "kills": 0, "deaths":8}
    , {"steamid": "STEAM_0:1:16097990", "team": 2, "name": "foster",      "mostplayedclass": 1, "playedclasses": 1,   "kills": 2, "deaths":4}
    , {"steamid": "STEAM_0:0:7422703",  "team": 3, "name": "binarystar!", "mostplayedclass": 1, "playedclasses": 35,  "kills": 9, "deaths":9}
    , {"steamid": "STEAM_0:0:17990207", "team": 2, "name": "dy<br>dx",    "mostplayedclass": 3, "playedclasses": 4,   "kills": 8, "deaths":4}
    , {"steamid": "STEAM_0:1:11029950", "team": 3, "name": "rando",       "mostplayedclass": 3, "playedclasses": 4,   "kills": 4, "deaths":2}
    , {"steamid": "STEAM_0:0:14353663", "team": 2, "name": "Sizzling",    "mostplayedclass": 3, "playedclasses": 4,   "kills": 2, "deaths":2}
    , {"steamid": "STEAM_0:1:9607258",  "team": 3, "name": "Dave__AC",    "mostplayedclass": 3, "playedclasses": 4,   "kills": 1, "deaths":4}
    , {"steamid": "STEAM_0:1:19111546", "team": 2, "name": "drdonutman",  "mostplayedclass": 4, "playedclasses": 8,   "kills": 1, "deaths":5}
    , {"steamid": "STEAM_0:0:21274546", "team": 3, "name": "Gobiner",     "mostplayedclass": 4, "playedclasses": 323, "kills": 3, "deaths":1}
    , {"steamid": "STEAM_0:0:9038326",  "team": 2, "name": "Trekkie",     "mostplayedclass": 5, "playedclasses": 16,  "kills": 4, "deaths":6}
    , {"steamid": "STEAM_0:0:5486374",  "team": 3, "name": "eXtine",      "mostplayedclass": 5, "playedclasses": 16,  "kills": 7, "deaths":1}
    // , {"steamid": "STEAM_0:1:19550627", "team": 3, "name": "Jay",         "mostplayedclass": 5, "playedclasses": 16,  "kills": 3, "deaths":0}
    , {"steamid": "STEAM_0:1:5201690",  "team": 2, "name": "b4nny",       "mostplayedclass": 4, "playedclasses": 8,   "kills": 9, "deaths":1}
    ]
  }}

  /**
   * Test 6: Mock updateStats, endofround=true, old player reappeared (Jay)
   */

, statsHeaders6: {
    "sizzlingstats": "v0.1"
  , "endofround": "true"
  , "sessionid": "something"
  }

, statsBody6: {"stats": {
    "map": "YouShouldNotSeeThis"
  , "hostname": "YouShouldNotSeeThis"
  , "bluname": "YouShouldNotSeeThis"
  , "redname": "YouShouldNotSeeThis"
  , "bluscore": 1
  , "redscore": 0
  , "teamfirstcap": 3
  , "roundduration": 160
  , "players": [
      {"steamid": "STEAM_0:0:86144",    "team": 2, "name": "Cigar",       "mostplayedclass": 1, "playedclasses": 0,   "kills": 0, "deaths":2}
    , {"steamid": "STEAM_0:1:17260233", "team": 3, "name": "SteveC",      "mostplayedclass": 1, "playedclasses": 3,   "kills": 0, "deaths":8}
    , {"steamid": "STEAM_0:1:16097990", "team": 2, "name": "foster",      "mostplayedclass": 1, "playedclasses": 1,   "kills": 2, "deaths":4}
    , {"steamid": "STEAM_0:0:7422703",  "team": 3, "name": "binarystar!", "mostplayedclass": 1, "playedclasses": 35,  "kills": 9, "deaths":9}
    , {"steamid": "STEAM_0:0:17990207", "team": 2, "name": "dy<br>dx",    "mostplayedclass": 3, "playedclasses": 4,   "kills": 8, "deaths":4}
    , {"steamid": "STEAM_0:1:11029950", "team": 3, "name": "rando",       "mostplayedclass": 3, "playedclasses": 4,   "kills": 4, "deaths":2}
    , {"steamid": "STEAM_0:0:14353663", "team": 2, "name": "Sizzling",    "mostplayedclass": 3, "playedclasses": 4,   "kills": 2, "deaths":2}
    , {"steamid": "STEAM_0:1:9607258",  "team": 3, "name": "Dave__AC",    "mostplayedclass": 3, "playedclasses": 4,   "kills": 1, "deaths":4}
    , {"steamid": "STEAM_0:1:19111546", "team": 2, "name": "drdonutman",  "mostplayedclass": 4, "playedclasses": 8,   "kills": 1, "deaths":5}
    , {"steamid": "STEAM_0:0:21274546", "team": 3, "name": "Gobiner",     "mostplayedclass": 4, "playedclasses": 323, "kills": 3, "deaths":1}
    , {"steamid": "STEAM_0:0:9038326",  "team": 2, "name": "Trekkie",     "mostplayedclass": 5, "playedclasses": 16 , "kills": 4, "deaths":6}
    , {"steamid": "STEAM_0:0:5486374",  "team": 3, "name": "eXtine",      "mostplayedclass": 5, "playedclasses": 16 , "kills": 7, "deaths":1}
    , {"steamid": "STEAM_0:1:19550627", "team": 3, "name": "Jay",         "mostplayedclass": 5, "playedclasses": 16,  "kills": 3, "deaths":0}
    , {"steamid": "STEAM_0:1:5201690",  "team": 2, "name": "b4nny",       "mostplayedclass": 4, "playedclasses": 8,   "kills": 9, "deaths":1}
    ]
  }}

  /**
   * Test 7: Mock gameover + chats
   */

, statsHeaders7: {
    "sizzlingstats": "v0.1"
  , "sessionid": "something"
  , "matchduration": "222"
  }

, statsBody7: {"chats": [
    { "steamid": "STEAM_0:0:14353663"
    , "isTeam": 0
    , "time": 156
    , "message": "\"My name is SizzlingCalamari. Goodbye world!\"" }
  , { "steamid": "STEAM_0:0:7422703"
    , "isTeam": 0
    , "time": 161
    , "message": "BINARYSTAR SAYS: THIS IS GOODBYE" }
  ]}

};
