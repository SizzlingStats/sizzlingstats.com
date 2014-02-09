'use strict';


module.exports = function(grunt) {

  grunt.initConfig({
    mochaTest: {
      test: {
        options: {
          mocha: require('mocha')
        , reporter: 'spec'
        , growl: true
        , require: [
            'coffee-script/register'
          , 'test/_support/common'
          , 'test/_support/factories'
          ]
        }
      , src: [
          'test/**/*.coffee'
        , 'test/**/*.js'
        , '!test/_support/**'
        ]
      }
    }
  , watch: {
      scripts: {
        files: [
          '**/*.js'
        , '**/*.coffee'
        , '!**/node_modules/**'
        ]
      , tasks: [
          'mochaTest'
        ]
      }
    }
  });

  
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('test', 'mochaTest');
  grunt.registerTask('default', 'mochaTest');
};
