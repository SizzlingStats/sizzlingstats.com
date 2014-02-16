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
          'env:test'
        , 'mochaTest'
        ]
      }
    }

  , env : {
      options : {
        // Shared Options Hash
      }
    , dev : {
        NODE_ENV : 'development'
      }
    , test : {
        NODE_ENV : 'test'
      }
    }

  });

  
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-env');

  grunt.registerTask('test', ['env:test', 'mochaTest']);
  grunt.registerTask('default', 'test');
};
