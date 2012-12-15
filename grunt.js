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
			banner: '/*! <%= pkg.title %> v<%= pkg.version %> | MIT license | <%= pkg.homepage %> */'
		},

		dist: {
			out: 'dist/joss.js',
			//remove requirejs dependency from built package (almond)
			standalone: true,
			//String or Array of files for which to trace dependencies and build
			//include: ['joss/geometry/**', 'joss/util/**', 'jossx/validation/**'],
			include: ['joss/**/*.js', 'jossx/**/*.js'],
			//exclude files from the 'include' list. Useful to add specific
			//exceptions to globbing.
			exclude: ['joss/util/collection/**'],
			//exclude files and their dependencies from the *built* source
			//Difference from 'exclude': files in 'excludeBuilt' will be
			//excluded even if they are dependencies of files in 'include'
			excludeBuilt: [],
			//exclude files from the *built* source, but keep any dependencies of the files.
			excludeShallow: []
		},

		doc: {
			repoview: 'https://github.com/zship/joss/blob/develop/',
			useJsdocCache: true,
			include: 'src/joss/**/*.js',
			//use joss/oop/Classes to discern inheritance heirarchy, rather than @extends annotations
			autoInherit: true,
			//include: 'src/joss/oop/**',
			//include: ['src/joss/geometry/DomRect.js', 'src/joss/geometry/Rect.js', 'src/joss/geometry/TestRect.js', 'src/joss/geometry/Position.js'],
			//include: 'src/joss/mvc/Controller.js',
			//include: ['src/joss/geometry/Rects.js', 'src/joss/geometry/Rect.js'],
			types: (function() {
				var types = [];

				types.push({
					name: 'Constructor',
					link: 'https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Object/constructor'
				});

				types.push({
					name: 'jQuery',
					link: 'http://api.jquery.com/jQuery/'
				});

				types.push({
					name: 'jquery',
					link: 'http://api.jquery.com/jQuery/'
				});

				types.push({
					name: 'require',
					link: 'http://requirejs.org/'
				});

				types.push({
					regexp: /amd-utils\/.*/,
					link: 'http://millermedeiros.github.com/amd-utils/'
				});

				types.push({
					regexp: /dojo\/(.*)/,
					link: 'http://dojotoolkit.org/reference-guide/1.8/dojo/$1.html'
				});

				return types;
			})()
		},

		clean: [
			'doc/out',
			'<config:dist.out>',
			'<config:min.dist.dest>'
		],

		min: {
			dist: {
				src: ['<banner>', '<config:dist.out>'],
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
		})(),

		test: {
			generateFailing: [
				'src/joss/**/*.js',
				'src/jossx/**/*.js'
			],
			run: false
		},

		server: {
			port: 8000,
			base: '.'
		},

		whatrequires: {
			module: 'src/joss/oop/classes/defaults.js',
			pool: 'src/joss/**/*.js'
			//module: 'test/spec/joss/Lifecycle.js',
			//pool: 'test/spec/**/*.js'
		},

		requirejs: {
			baseUrl: 'src',

			optimize: 'none',

			packages: [
				{ name: 'dojo', location: 'lib/dojo' },
				{ name: 'amd-utils', location: 'lib/amd-utils/src' },
				{ name: 'deferreds', location: 'lib/deferreds/src/deferreds' }
			],

			paths: {
				//dojo's i18n module doesn't build with r.js (errors out)
				'dojo/i18n': '../dist/lib/i18n-patched',
				'jade': 'lib/jade/jade',
				'jquery': 'empty:',
				'jquery.hashchange': 'lib/jquery.ba-hashchange',
				'jquery.mousewheel': 'lib/jquery.mousewheel',
				'jquery.event.drag': 'lib/jquery.event.drag-2.0',
				'jquery.event.input': 'lib/jquery.event.input',
				'jquery.jgestures': 'lib/jgestures'
			},

			shim: {
				'jade': {
					exports: 'jade'
				}
			},

			keepBuildDir: true,
			locale: "en-us",
			useStrict: false,
			skipModuleInsertion: false,
			findNestedDependencies: false,
			removeCombined: false,
			preserveLicenseComments: false,
			logLevel: 0
		}

	});

	// no-arg grunt
	//grunt.registerTask( 'default', 'update_submodules dist min' );
	
	grunt.loadNpmTasks('grunt-contrib-clean');

	grunt.loadTasks('tasks');

};
