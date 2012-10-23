module.exports = function( grunt ) {

	"use strict";

	//grunt's jshint helper expects options to be in an 'options' property
	function readJshint( path ) {
		var data = {};
		try {
			data = grunt.file.readJSON( path );
			grunt.utils._.each(data, function(val, key, o) {
				o.options = o.options || {};
				if (key !== 'globals') {
					o.options[key] = val;
					delete o[key];
				}
			});
			grunt.verbose.write( "Reading " + path + "..." ).ok();
		} catch(e) {}
		return data;
	}

	grunt.initConfig({
		pkg: '<json:package.json>',

		meta: {
			banner: '/*! <%= pkg.title %> v<%= pkg.version %> | MIT license */'
		},

		dist: {
			optimize: 'none',
			baseUrl: 'src',
			out: 'dist/joss.js',
			//include all files under 'joss'
			include: (function() {
				return grunt.file.expandFiles('src/joss/**').map(function(path, i) {
					return path.replace(/^src\//, '');
				});
			})()
		},

		doc: {
			path: 'src/joss/geometry'
		},

		min: {
			dist: {
				src: ['<banner>', 'dist/joss.js'],
				dest: 'dist/joss.min.js'
			}
		},

		uglify: {
			codegen: {
				ascii_only: true,
				beautify: false,
				max_line_length: 1000
			}
		},

		lint: {
			files: 'src/joss/**/*.js'
		},

		jshint: (function() {
			return readJshint('src/joss/.jshintrc') || {};
		})()

	});

	// no-arg grunt
	//grunt.registerTask( 'default', 'update_submodules dist min' );

	// Load grunt tasks from NPM packages
	//grunt.loadNpmTasks( 'grunt-compare-size' );
	//grunt.loadNpmTasks( 'grunt-git-authors' );
	//grunt.loadNpmTasks( 'grunt-update-submodules' );

	grunt.loadTasks('tasks');

};
