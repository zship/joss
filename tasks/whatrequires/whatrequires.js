module.exports = function( grunt ) {
	'use strict';


	var _ = grunt.utils._;
	var path = require('path');
	var parseDir = './lib/parse';


	grunt.registerTask('whatrequires', 'Traces which files depend on given js file', function() {
		var config = grunt.config.get(this.name);
		var done = this.async();

		var rjsconfig = grunt.config.get('requirejs');
		var baseUrl = rjsconfig.baseUrl;
		var searchFile = path.resolve(process.cwd() + '/' + config.module);

		grunt.log.writeln('Files depending on ' + searchFile + ':');
		grunt.log.writeln('-----------------------------------------------------------');

		var requirejs = require('./lib/r.js');
		requirejs.config({
			baseUrl: __dirname,
			nodeRequire: require
		});

		requirejs([parseDir], function(parse) {
			var pool = grunt.file.expandFiles(config.pool);
			//console.log(JSON.stringify(pool, false, 4));

			_.each(pool, function(file) {
				file = path.resolve(process.cwd() + '/' + file);
				var deps;
				try {
					deps = parse.findDependencies(file, grunt.file.read(file));
				}
				catch(e) {
					deps = [];
				}

				deps = _.map(deps, function(depPath) {
					depPath = depPath.replace(/\.js/, '');
					//leading '.'; relative
					if (depPath.search(/^\./) !== -1) {
						return path.normalize(path.dirname(file) + '/' + depPath + '.js');
					}
					return path.resolve(process.cwd() + '/' + baseUrl + '/' + depPath + '.js');
				});

				//console.log(file);
				//console.log(JSON.stringify(deps, false, 4));

				var match = _.intersection(deps, [searchFile]);
				if (match.length) {
					grunt.log.writeln(file);
				}
			});
			done();
		});
	});

};
