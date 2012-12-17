module.exports = function(grunt) {
	'use strict';

	var path = require('path');
	var libdir = path.resolve(__dirname + '/lib');
	var requirejs = require(libdir + '/r.js');
	var _ = grunt.utils._;


	grunt.registerTask('dist', 'Runs requirejs optimizer', function() {
		var config = grunt.config.get(this.name);
		var done = this.async();

		var rjsconfig = grunt.config.get('requirejs');
		var baseUrl = rjsconfig.baseUrl;
		var rStripBaseUrl = new RegExp('^' + baseUrl + '\\/');


		//------------------------------------------------------------
		// Transform globbed config values into lists of files
		//------------------------------------------------------------
		var _expanded = function(arr) {
			var files = [];
			arr.forEach(function(val) {
				files = files.concat(
					grunt.file.expandFiles(baseUrl + '/' + val).map(function(path) {
						return path.replace(rStripBaseUrl, '').replace('.js', '');
					})
				);
			});
			return _.uniq(files);
		};

		['include', 'exclude', 'excludeBuilt', 'excludeShallow'].forEach(function(name) {
			config[name] = config[name] || [];
			if (_.isString(config[name])) {
				config[name] = [config[name]];
			}
			config[name] = _expanded(config[name]);
		});

		config.include = _.difference(config.include, config.exclude);

		//'exclude' is a requirejs property meaning 'exclude a module and its
		//dependencies'. We used the name for our own purpose, now reassign it
		//to align with requirejs' meaning.
		config.exclude = _.uniq(config.excludeBuilt);


		//use almond to remove requirejs dependency
		if (config.standalone) {
			config.name = path.relative(baseUrl, libdir + '/almond');
			config.wrap = {};
			config.wrap.start = 'window.joss = (function() {\n\t"use strict";';
			config.wrap.end = '';
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
			if (!config.standalone) {
				done();
				return;
			}

			//when built without requirejs support, provide global references to
			//every object in the whole dependency graph
			var basePath = _.initial(__dirname.split('/')).join('/');
			var deps = buildResponse.split('\n');
			deps = _.chain(deps)
				.compact()
				.rest(2)
				.filter(function(path) {
					return path.search(/\.js/g) !== -1;
				})
				.map(function(path) {
					path = path.replace(new RegExp('^' + basePath), '');
					path = path.replace(/^\/src\//, '');
					path = path.replace(/\.js/, '');
					return path;
				})
				.map(function(path) {
					config.packages.forEach(function(pkg) {
						path = path.replace(pkg.location, pkg.name);
					});

					var cpaths = [];
					cpaths = _.map(config.paths, function(val, key) {
						return {from: val, to: key};
					});

					cpaths = _.sortBy(cpaths, function(obj) {
						return -1 * obj.from.length;
					});

					_.every(cpaths, function(obj) {
						if (path.search(obj.from) !== -1) {
							path = path.replace(obj.from, obj.to);
							return false;
						}
						return true;
					});
					return path;
				})
				.filter(function(path) {
					return (path.search(/^\.\./) === -1) && (path.search(/^\//) === -1);
				})
				.value();

			//console.log(deps);

			var appendString = '\n\n/*\n';
			appendString += '-----------------------------------------\n';
			appendString += 'Global definitions for a built joss\n';
			appendString += '-----------------------------------------\n';
			appendString += '*/\n\n';
			appendString += 'return {\n';
			//appendString += 'var lang = require("dojo/_base/lang");\n\n';
			for (var i = 0; i < deps.length; i++) {
				var path = deps[i];
				appendString += '\t"' + path + '": require("' + path + '")';
				//appendString += 'lang.setObject("' + path.replace(/\//g, '.') + '", require("' + path + '"), window);\n';
				if (i < deps.length - 1) {
					appendString += ',\n';
				}
				else {
					appendString += '\n';
				}
			}
			appendString += '};\n';
			appendString += '\n\n})();';

			var contents = grunt.file.read(config.out);
			contents += appendString;
			grunt.file.write(config.out, contents, 'utf-8');

			done();
		});

	});

};