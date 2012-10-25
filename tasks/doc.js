module.exports = function(grunt) {
	'use strict';

	var docdir = 'doc';
	var libdir = 'doc/lib';

	var fs = require("fs");
	var child = require("child_process");
	var _ = grunt.utils._;

	var taffy = require("../doc/lib/taffy.js").taffy;
	var jade = require('jade');
	var md = require('markdown');



	var getProp = function(/*Array*/parts, /*Boolean*/create, /*Object*/context){
		var p, i = 0, dojoGlobal = this;
		if(!context){
			if(!parts.length){
				return dojoGlobal;
			}else{
				p = parts[i++];
				context = context || (p in dojoGlobal ? dojoGlobal[p] : (create ? dojoGlobal[p] = {} : undefined));
			}
		}
		while(context && (p = parts[i++])){
			context = (p in context ? context[p] : (create ? context[p] = {} : undefined));
		}
		return context; // mixed
	};


	var setObject = function(name, value, context){
		var parts = name.split("."), p = parts.pop(), obj = getProp(parts, true, context);
		return obj && p ? (obj[p] = value) : undefined; // Object
	};


	var getObject = function(name, create, context){
		return getProp(name.split("."), create, context); // Object
	};


	var processJsDoc = function(json) {

		//console.log(stdout);
		var doc = json.replace(/<Object>/gm, "\"Object\"");
		doc = doc.replace(/:\sundefined/gm, ": \"undef\"");

		doc = taffy(doc);
		doc({undocumented: true}).remove();
		doc().each(function(record, recordnum) {
			record.lineno = record && record.meta && record.meta.lineno;
		});

		//go through each unique member and merge all descriptions into the first-occurring member
		var names = doc().distinct('longname');
		names.forEach(function(val, i) {
			var entries = doc({longname:val}).order('lineno');
			var first = entries.first();
			var merged = first.description || '';
			entries.each(function(record) {
				if (record['___id'] !== first['___id']) {
					merged += '\n\n' + record.description;
					//doc(first['___id']).update('description', first.description || '' + '\n' + record.description);
					//first.description = first.description || '';
					//first.description += '\n' + record.description;
				}
			});
			doc(first['___id']).update('description', merged);
		
		});
		doc.sort("lineno");

		//get rid of the duplicates which we used to augment the first definitions
		var docmap = {};
		_.all(names, function(val, i) {
			//console.log(val);
			docmap[val] = doc({longname:val}).order('lineno').first();
			return true;
		});

		var doclist = [];
		_.all(docmap, function(val, key) {
			doclist.push(val);
			return true;
		});

		//construct a new db to sort everything into:
		//package
		//--class
		//---methods
		//---properties
		var db = taffy(doclist);


		var typeMap = {};
		db({kind: 'class'}).each(function(record) {
			//collect a map of longnames to short aliases for classes, to be used when
			//printing parameters and return types
			var className = record.name;
			var classLongName = record.longname;
			typeMap[classLongName] = {
				longName: classLongName,
				shortName: className,
				link: '/doc/' + classLongName.replace(/\./g, '/')
			};
		});

		['Number', 'String'].forEach(function(val) {
			typeMap[val] = {
				longName: val,
				shortName: val,
				link: 'https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/' + val
			};
		});

		function getType(name) {
			if (!name) {
				return {
					shortName: 'void',
					longName: 'void',
					link: ''
				};
			}

			if (typeMap[name]) {
				return typeMap[name];
			}

			console.log('WARNING: The type ' + name + ' was not declared. Documentation will not present a link.');

			return {
				shortName: name,
				longName: name,
				link: ''
			};
		}


		var graph = {};
		db({kind: 'class'}).each(function(record) {

			var classLongName = record.longname;

			record.description = record.description || '';
			record.description = md.parse(record.description);

			graph[classLongName] = {};
			graph[classLongName]['constructor'] = record;
			graph[classLongName]['members'] = {};
			graph[classLongName]['methods'] = {};

			db({kind: 'member'}, {memberof: classLongName}).each(function(record) {
				var member = graph[classLongName]['members'][record.name] = record;
				member.type = typeMap[member.type.names[0]];

				member.description = member.description || '';
				member.description = md.parse(member.description);
			});

			db({kind: 'function'}, {memberof: classLongName}).each(function(record) {
				//console.log(JSON.stringify(record, null, 4));
				var method = graph[classLongName]['methods'][record.name] = record;

				method.description = method.description || '';
				method.description = md.parse(method.description);

				method.params = method.params || [];

				method.params.every(function(param) {
					if (!param.type || !param.type.names) {
						param.type = getType(null);
						return true; //continue
					}
					param.type = getType(param.type.names[0]);
					return true;
				});

				if (method.returns) {
					method.returns = getType(method.returns[0].type.names[0]);
				}
				else {
					method.returns = getType(null);
				}
			});
		});

		return graph;

		//console.log(JSON.stringify(graph, null, 4));
		//renderClass(graph, '');

	};


	var classTpl;

	var renderClass = function(graph, path, callback) {

		/*
		 *if (!graph['methods']) {
		 *    _.all(graph, function(val, key) {
		 *        renderClass(val, path + '/' + key, callback);
		 *        return true;
		 *    });
		 *    return;
		 *}
		 */

		classTpl = classTpl || grunt.file.read(docdir + '/tpl/class.jade', 'utf-8');
		var data = jade.compile(classTpl)({cl: graph, module: path});
		callback(graph, path, data);

	};

	//idea: put a search box above class list that filters the class list


	grunt.registerTask('doc', 'Runs requirejs optimizer', function() {
		var config = grunt.config.get(this.name);
		var done = this.async();

		child.exec(libdir + '/jsdoc/jsdoc -X ' + config.path, {maxBuffer: 2000000}, function(error, stdout, stderr) {
			var graph = processJsDoc(stdout);

			_.each(graph, function(val, key) {
				if (!key) {
					return true; //continue
				}

				var path = key.replace(/\./g, '/');
				console.log(path);
				//console.log(val);
				renderClass(val, path, function(graph, path, data) {
					var filePath = docdir + '/out/' + path + '.html';
					grunt.log.write('Writing documentation file ' + filePath + ' ...').ok();
					grunt.file.write(filePath, data, 'utf-8');
				});
			});

			done();
		});
	});


};
