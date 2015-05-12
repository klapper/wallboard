module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        concat: {
            options: {
                separator: ';'
                },
            js: {
                src: ['public/javascripts/jquery-1.11.0.min.js',
                      'public/javascripts/jquery-ui-1.10.4.min.js',
                      'public/javascripts/angular.js',
                      'public/javascripts/angular-route.js',
                      'public/javascripts/angular-resource.js',
                      'public/javascripts/angular-animate.min.js',
                      'public/javascripts/angular-inview.js',
                      'public/javascripts/ui-utils.js',
                      'public/javascripts/ui-bootstrap-tpls-0.10.0.min.js',
                      'public/javascripts/underscore-min.js',
                      'public/javascripts/app.js',
                      'public/javascripts/services.js',
                      'public/javascripts/controllers.js',
                      'public/elements/analogue_clock.js',
                      'public/javascripts/gridster.js',
                      'public/javascripts/angular-notify.js',
                      'public/javascripts/ui-iconpicker.min.js',
                      'public/javascripts/bootstrap-colorpicker-module.js',
                      'public/javascripts/welcome_developers.js'],
                dest: 'dist/<%= pkg.name %>.js'
            },
            css: {
                src: ['public/stylesheets/bootstrap.min.css',
                      'public/stylesheets/style.css',
                      'public/stylesheets/gridster.css',
                      'public/stylesheets/jquery-ui-1.10.4.min.css',
                      'public/stylesheets/font-awesome.css',
                      'public/stylesheets/angular-notify.css',
                      'public/stylesheets/ui-iconpicker.min.css',
                      'public/stylesheets/animate.css',
                      'public/stylesheets/colorpicker.css'],
                dest: 'dist/<%= pkg.name %>.css'
            },
        },
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
            },
            dist: {
                files: {
                    'public/minified/<%= pkg.name %>.min.js': ['<%= concat.js.dest %>']
                }
            }
        },
        cssmin: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
            },
            dist: {
                files: {
                    'public/minified/<%= pkg.name %>.min.css': ['<%= concat.css.dest %>']
                }
            }
        }
  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-cssmin');


  grunt.registerTask('default', ['concat', 'uglify','cssmin']);

};