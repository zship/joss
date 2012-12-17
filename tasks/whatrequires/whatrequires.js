module.exports = function( grunt ) {
	'use strict';

	var _ = grunt.utils._;
	var path = require('path');
	var requirejs = require('./lib/r.js');
	requirejs.config({
		baseUrl: __dirname,
		nodeRequire: require
	});
	var parseDir = './lib/parse';


	grunt.registerTask('whatrequires', 'Traces which files depend on given js file', function() {
		var config = grunt.config.get(this.name);
		var done = this.async();

		var rjsconfig = grunt.config.get('requirejs');
		var baseUrl = rjsconfig.baseUrl;
		var searchFile = path.resolve(process.cwd() + '/' + config.module);

		grunt.log.writeln('Files depending on ' + searchFile + ':');
		grunt.log.writeln('-----------------------------------------------------------');

		requirejs([parseDir], function(parse) {
			var pool = grunt.file.expandFiles(config.pool);

			_.each(pool, function(file) {
				file = path.resolve(process.cwd() + '/' + file);
				//console.log(file);
				var deps;
				try {
					deps = parse.findDependencies(file, grunt.file.read(file));
				}
				catch(e) {
					deps = [];
				}
				deps = _.map(deps, function(depPath) {
					depPath = depPath.replace(/\.js/, '');
					return path.resolve(process.cwd() + '/' + baseUrl + '/' + depPath + '.js');
				});
				//console.log(deps);
				var match = _.intersection(deps, [searchFile]);
				if (match.length) {
					grunt.log.writeln(file);
				}
			});
			done();
		});
	});

};
