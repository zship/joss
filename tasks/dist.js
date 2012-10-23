module.exports = function(grunt) {
	'use strict';

	var libdir = '../dist/lib';
	var requirejs = require(libdir + '/r.js');

	grunt.registerTask('dist', 'Runs requirejs optimizer', function(mode) {
		var config = grunt.config.get(this.name);
		var done = this.async();

		config = grunt.utils._.extend({

			/*
			 *packages: [
			 *    { name: 'dojo', location: 'dojo' }
			 *],
			 */

			paths: {
				'dojo/i18n': libdir + '/i18n',
				'jquery': 'lib/jquery',
				'jquery.curstyles': 'lib/jquery.curstyles',
				'jquery.hashchange': 'lib/jquery.ba-hashchange',
				'jquery.mousewheel': 'lib/jquery.mousewheel',
				'jquery.event.drag': 'lib/jquery.event.drag-2.0',
				'jquery.event.input': 'lib/jquery.event.input',
				'jquery.jgestures': 'lib/jgestures'
			},

			keepBuildDir: true,

			//locale: "en-us",

			useStrict: false,

			skipModuleInsertion: false,

			findNestedDependencies: false,

			removeCombined: false,

			preserveLicenseComments: false,

			//name: "almond.js",

			wrap: {
				start: '(function() {\n\t"use strict";',
				end: (function() {
					var ret = '\n\n/*\n';
					ret += '-----------------------------------------\n';
					ret += 'Global definitions for a built joss\n';
					ret += '-----------------------------------------\n';
					ret += '*/\n\n';
					ret += 'var lang = require("dojo/_base/lang");\n\n';
					config.include.forEach(function(val, i) {
						var path = val.replace(/\.js/, '');
						ret += 'lang.setObject("' + path.replace(/\//g, '.') + '", require("' + path + '"), window);\n';
					});
					ret += '\n})();';
					return ret;
				})()
			},

			onBuildWrite: function (moduleName, path, contents) {
				return contents.replace(/\"\S*i18n!(\S*?)\",*/g, '"dojo\/i18n!$1",');
			},


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
