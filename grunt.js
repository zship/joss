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
			out: 'dist/joss.js',
			//remove requirejs dependency from built package (almond)
			standalone: true,
			//String or Array of files for which to trace dependencies and build
			include: ['joss/geometry/**', 'joss/util/**', 'jossx/validation/**'],
			//exclude files from the 'include' list. Useful to add specific
			//exceptions to globbing.
			exclude: [],
			//exclude files and their dependencies from the *built* source
			//Difference from 'exclude': files in 'excludeBuilt' will be
			//excluded even if they are dependencies of files in 'include'
			excludeBuilt: [],
			//exclude files from the *built* source, but keep any dependencies of the files.
			excludeShallow: []
		},

		doc: {
			repoview: 'https://github.com/zship/joss/blob/develop/',
			path: 'src/joss/geometry/Rect.js'
			//path: 'src/joss/mvc/Controller.js'
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
