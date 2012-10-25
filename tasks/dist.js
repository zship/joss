module.exports = function(grunt) {
	'use strict';

	var libdir = '../dist/lib';
	var requirejs = require(libdir + '/r.js');
	var rjsconfig = require('./rjsconfig');
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
		var baseUrl = rjsconfig.baseUrl;
		var rStripBaseUrl = new RegExp('^' + baseUrl + '\\/');


		//------------------------------------------------------------
		// Transform globbed config values into lists of files
		//------------------------------------------------------------
		if (_.isString(config.include)) {
			config.include = [config.include];
		}

		config.include.forEach(function(val) {
			files = files.concat(
				grunt.file.expandFiles(baseUrl + '/' + val).map(function(path) {
					return path.replace(rStripBaseUrl, '').replace('.js', '');
				})
			);
		});


		config.exclude = config.exclude || [];
		if (_.isString(config.exclude)) {
			config.exclude = [config.exclude];
		}

		config.exclude.forEach(function(val) {
			var excludedFiles = grunt.file.expandFiles(baseUrl + '/' + val).map(function(path) {
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
				grunt.file.expandFiles(baseUrl + '/' + val).map(function(path) {
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
				grunt.file.expandFiles(baseUrl + '/' + val).map(function(path) {
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
		config = _.extend(rjsconfig, config);

		requirejs.optimize(config, function (buildResponse) {
			//console.log(buildResponse);
			done();
		});

	});

};
