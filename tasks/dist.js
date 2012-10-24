module.exports = function(grunt) {
	'use strict';

	var libdir = '../dist/lib';
	var requirejs = require(libdir + '/r.js');
	var _ = grunt.utils._;

	/*
	 *root.dojoConfig = {
	 *    locale: 'en-us'
	 *};
	 */

	grunt.registerTask('dist', 'Runs requirejs optimizer', function(mode) {
		var config = grunt.config.get(this.name);
		var done = this.async();
		var files = [];
		var rStripBaseUrl = new RegExp('^' + config.baseUrl + '\\/');


		//------------------------------------------------------------
		// Transform globbed config values into lists of files
		//------------------------------------------------------------
		if (_.isString(config.include)) {
			config.include = [config.include];
		}

		config.include.forEach(function(val) {
			files = files.concat(
				grunt.file.expandFiles(config.baseUrl + '/' + val).map(function(path) {
					return path.replace(rStripBaseUrl, '').replace('.js', '');
				})
			);
		});


		config.exclude = config.exclude || [];
		if (_.isString(config.exclude)) {
			config.exclude = [config.exclude];
		}

		config.exclude.forEach(function(val) {
			var excludedFiles = grunt.file.expandFiles(config.baseUrl + '/' + val).map(function(path) {
				return path.replace(rStripBaseUrl, '').replace('.js', '');
			});
			files = _.difference(files, excludedFiles);
		});

		//'include' is a requirejs property. We used the name for our own
		//purpose, now reassign it to align with requirejs' meaning.
		config.include = _.uniq(files);
		files = [];


		config.excludeBuilt = config.excludeBuilt || [];
		if (_.isString(config.excludeBuilt)) {
			config.excludeBuilt = [config.excludeBuilt];
		}

		config.excludeBuilt.forEach(function(val) {
			files = files.concat(
				grunt.file.expandFiles(config.baseUrl + '/' + val).map(function(path) {
					return path.replace(rStripBaseUrl, '').replace('.js', '');
				})
			);
		});

		//'exclude' is a requirejs property meaning 'exclude a module and its
		//dependencies' We used the name for our own purpose, now reassign it
		//to align with requirejs' meaning.
		config.exclude = _.uniq(files);
		files = [];


		config.excludeShallow = config.excludeShallow || [];
		if (_.isString(config.excludeShallow)) {
			config.excludeShallow = [config.excludeShallow];
		}

		config.excludeShallow.forEach(function(val) {
			files = files.concat(
				grunt.file.expandFiles(config.baseUrl + '/' + val).map(function(path) {
					return path.replace(rStripBaseUrl, '').replace('.js', '');
				})
			);
		});

		config.excludeShallow = _.uniq(files);


		//use almond to remove requirejs dependency
		if (config.standalone) {
			config.name = libdir + '/almond';
			config.wrap = {};
			config.wrap.start = '(function() {\n\t"use strict";';
			config.wrap.end = (function() {
				var ret = '\n\n/*\n';
				ret += '-----------------------------------------\n';
				ret += 'Global definitions for a built joss\n';
				ret += '-----------------------------------------\n';
				ret += '*/\n\n';
				ret += 'var lang = require("dojo/_base/lang");\n\n';
				config.include.forEach(function(val) {
					var path = val.replace(/\.js/, '');
					ret += 'lang.setObject("' + path.replace(/\//g, '.') + '", require("' + path + '"), window);\n';
				});
				ret += '\n})();';
				return ret;
			})();
		}
		else {
			config.wrap = {};
			config.wrap.start = '(function() {\n\t"use strict";';
			config.wrap.end = '\n})();';
		}



		//------------------------------------------------------------
		// Merge our config values into a config object compatible with
		// requirejs
		//------------------------------------------------------------
		config = _.extend({

			/*
			 *packages: [
			 *    { name: 'dojo', location: 'dojo' }
			 *],
			 */

			paths: {
				//dojo's i18n module doesn't build with r.js (errors out)
				'dojo/i18n': libdir + '/i18n',
				'jquery': 'lib/jquery',
				'jquery.hashchange': 'lib/jquery.ba-hashchange',
				'jquery.mousewheel': 'lib/jquery.mousewheel',
				'jquery.event.drag': 'lib/jquery.event.drag-2.0',
				'jquery.event.input': 'lib/jquery.event.input',
				'jquery.jgestures': 'lib/jgestures'
			},

			keepBuildDir: true,

			locale: "en-us",

			useStrict: false,

			skipModuleInsertion: false,

			findNestedDependencies: false,

			removeCombined: false,

			preserveLicenseComments: false,

			//onBuildWrite: function (moduleName, path, contents) {
				//place dojo i18n module back in, so built copy can use dojo's
				//large collection of nls resources
				//contents = contents.replace(/dojo\/i18n/g, 'i18n');
				//return contents.replace(/\"\S*i18n!(\S*?)\",*/g, '"dojo\/i18n!$1",');
			//},


			//Sets the logging level. It is a number. If you want "silent" running,
			//set logLevel to 4. From the logger.js file:
			//TRACE: 0,
			//INFO: 1,
			//WARN: 2,
			//ERROR: 3,
			//SILENT: 4
			//Default is 0.
			logLevel: 0

		}, config);


		requirejs.optimize(config, function (buildResponse) {
			//console.log(buildResponse);
			done();
		});

	});

};
