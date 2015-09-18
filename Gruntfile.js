module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    "mozilla-addon-sdk": {
      'stable': {
        options: {
          revision: "1.17"
        }
      }
    },
    "mozilla-cfx-xpi": {
      'stable': {
        options: {
          "mozilla-addon-sdk": "stable",
          extension_dir: "extension/firefox",
          dist_dir: "dist/firefox"
        }
      }
    },
    "mozilla-cfx": {
      'stable': {
        options: {
          "mozilla-addon-sdk": "stable",
          extension_dir: "extension/firefox",
          command: "run",
          arguments: "-p /tmp/prime-ratings"
        }
      }
    },

    jshint: {
      files: [
        'Gruntfile.js',

        'extension/shared/**/*.js',

        'extension/firefox/data/*.js',
        'extension/firefox/lib/*.js',

        'extension/chrome/*.js'
      ],
      options: {
        // options here to override JSHint defaults
        globals: {
          jQuery: true
        }
      }
    },
    watch: {
      files: ['<%= jshint.files %>'],
      tasks: ['jshint']
    },

    copy: {
      ff: {
        options: {
          processContent: function(content, file) {
            switch(file) {
              case 'bower_components/jquery/jquery.min.js':
                // make sure fingerprint of library fits, so Mozilla addons does not reject it...
                return content.replace('//@ sourceMappingURL=jquery.min.map','//@ sourceMappingURL=jquery-2.1.0.min.map');
            }
            return content;
          }
        },
        files: [
          {expand: true, cwd: 'extension/shared/', src: ['**'], dest: 'extension/firefox/data/shared/'},
          {
            flatten: true,
            src: ['bower_components/jquery/dist/jquery.min.map'],
            dest: 'extension/firefox/data/components/jquery-2.1.0.min.map',
            filter: 'isFile'
          },
          {
            flatten: true,
            src: ['bower_components/jquery/dist/jquery.min.js'],
            dest: 'extension/firefox/data/components/jquery.min.js',
            filter: 'isFile'
          }
        ]
      },
      chrome: {
        files: [
          {expand: true, cwd: 'extension/shared/', src: ['**'], dest: 'extension/chrome/shared/'},
          {flatten: true, src: ['bower_components/jquery/dist/jquery.min.map'], dest: 'extension/chrome/components/jquery.min.map', filter: 'isFile'},
          {flatten: true, src: ['bower_components/jquery/dist/jquery.min.js'], dest: 'extension/chrome/components/jquery.min.js', filter: 'isFile'}
        ]
      }
    },

    compress: {
      chrome: {
        options: {
          archive: 'dist/chrome/<%= pkg.name %>.zip',
          level: 9,
          pretty: true
        },
        files: [
          {expand:true, cwd: 'extension/chrome', src: ['**/*'], dest: '/'}
        ]
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-mozilla-addon-sdk');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-compress');

  grunt.registerTask('ff:dev', ["copy:ff", "mozilla-cfx:stable"]);
  grunt.registerTask('ff:dist', ["copy:ff", "mozilla-cfx-xpi:stable"]);

  grunt.registerTask('chrome:dev', ["copy:chrome"]);
  grunt.registerTask('chrome:dist', ["copy:chrome", 'compress:chrome']);

  grunt.registerTask('setup', ["mozilla-addon-sdk"]);

  grunt.registerTask('dist', ['jshint', 'ff:dist', 'chrome:dist']);
  grunt.registerTask('default', ['setup', 'dist']);

};
