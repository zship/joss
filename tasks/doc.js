module.exports = function(grunt) {
	'use strict';

	var docdir = 'doc';
	var libdir = 'doc/lib';

	var fs = require("fs");
	var child = require("child_process");
	var _ = grunt.utils._;

	var taffy = require("../doc/lib/taffy.js").taffy;
	var jade = require('jade');
	var md = require('marked');
	var hljs = require('highlight.js');
	var async = require('async');


	md.setOptions({
		gfm: true,
		pedantic: false,
		sanitize: false,
		highlight: function(code, lang) {
			if (lang === 'js' || !lang) {
				lang = 'javascript';
			}
			return hljs.highlight(lang, code).value;
		}
	});



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


	//keep a list of all types used in the project
	//build the list in processJsDoc() below
	var typeMap = {};

	['Number', 'String', 'Object', 'Array', 'RegExp'].forEach(function(val) {
		typeMap[val] = {
			longName: val,
			name: val,
			link: 'https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/' + val
		};
	});

	typeMap['void'] = {
		longName: 'void',
		name: 'void',
		link: 'https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/undefined'
	};

	typeMap['Element'] = {
		longName: 'Element',
		name: 'Element',
		link: 'https://developer.mozilla.org/en-US/docs/DOM/element'
	};

	typeMap['jQuery'] = {
		longName: 'jQuery',
		name: 'jQuery',
		link: 'http://api.jquery.com/jQuery/'
	};

	function getTypes(names) {
		if (!names) {
			return [typeMap['void']];
		}

		var types = [];
		names.forEach(function(name) {
			if (typeMap[name]) {
				types.push(typeMap[name]);
				return true;
			}

			console.log('WARNING: The type ' + name + ' was not declared anywhere in the project. Documentation will not present a link.');

			types.push({
				name: name,
				longName: name,
				link: '#'
			});
		});

		return types;
	}


	var processJsDoc = function(json) {

		var doc = taffy(json);
		doc({undocumented: true}).remove();
		doc().each(function(record) {
			record.lineno = record && record.meta && record.meta.lineno;
		});

		//construct a new db to sort everything into:
		//package
		//--class
		//---methods
		//---properties
		//var db = taffy(doclist);
		var db = doc;


		db({kind: ['class', 'namespace']}).each(function(record) {
			//collect a map of longnames to short aliases for classes, to be used when
			//printing parameters and return types
			var className = record.name;
			var classLongName = record.longname;
			typeMap[classLongName] = {
				userDefined: true,
				longName: classLongName,
				name: className,
				link: '#'
			};
		});


		var graph = {};
		db({kind: ['class', 'namespace']}).each(function(record) {

			var classLongName = record.longname;

			record.description = record.description || '';

			graph[classLongName] = {};
			graph[classLongName]['constructor'] = record;
			graph[classLongName]['properties'] = {};
			graph[classLongName]['methods'] = {};

			var constructor = graph[classLongName]['constructor'];
			constructor.longName = constructor.longname;
			constructor.description = constructor.description || '';

			constructor.params = constructor.params || [];
			constructor.params.every(function(param) {
				if (!param.type || !param.type.names) {
					param.type = getTypes(null);
					return true; //continue
				}
				param.types = getTypes(param.type.names);
				return true;
			});


			db({kind: 'member'}, {memberof: classLongName}).each(function(record) {
				var member = graph[classLongName]['properties'][record.name] = record;
				member.longName = member.longname;
				member.types = member.type ? getTypes(member.type.names) : getTypes(null);
				member.description = member.description || '';
			});


			db({kind: 'function'}, {memberof: classLongName}).each(function(record) {
				//console.log(JSON.stringify(record, null, 4));
				var method = graph[classLongName]['methods'][record.name] = record;
				method.longName = method.longname;
				method.description = method.description || '';

				method.params = method.params || [];
				method.params.every(function(param) {
					if (!param.type || !param.type.names) {
						param.type = getTypes(null);
						return true; //continue
					}
					param.types = getTypes(param.type.names);
					return true;
				});

				if (method.returns) {
					method.returns = {types: getTypes(method.returns[0].type.names)};
				}
				else {
					method.returns = {types: getTypes(null)};
				}
			});
		});

		return graph;

	};


	//returns an Array of jsonpath-style strings pointing to jsdoc descriptions.
	//Use getObject() to get the object reference, then access the description
	//property.
	var _getDescriptions = function(obj, path) {
		path = path || '';
		var ret = [];
		if (!_.isObject(obj)) {
			return ret;
		}
		_.every(obj, function(child, key) {
			if (key === 'description') {
				ret.push(path);
			}
			ret = ret.concat(_getDescriptions(child, path ? path + '.' + key : key));
			return true;
		});
		return ret;
	};


	var mixinMarkdown = function(graph) {
		var mixins = grunt.file.expandFiles(docdir + '/mixin/**');
		mixins.every(function(path) {
			var mixin = grunt.file.read(path);

			path = path.replace(docdir + '/mixin/', '').replace('.md', '');
			var name = path.replace(/\//g, '.');
			var clazz = graph[name];

			if (!clazz) {
				return true;
			}

			//mixin = mixin.replace(/^`*js$/gm, '```');
			//console.log(mixin);

			//parse markdown "mixin" file for a special string "%[memberName]"
			var mixinParts = mixin.split(/^(%\S*)$/gm);
			clazz['module'] = {};
			clazz['module']['description'] = mixinParts[0];
			var mixinGraph = {};
			for (var i = 0, l = mixinParts.length; i < l; i++) {
				var part = mixinParts[i];
				if (part.search(/^%\S*$/) !== -1 && mixinParts[i+1]) {
					mixinGraph[part.replace('%', '')] = mixinParts[i+1];
				}
			}

			var descriptions = _getDescriptions(clazz);
			//console.log(JSON.stringify(descriptions, false, 4));

			_.each(mixinGraph, function(value, key) {
				descriptions.forEach(function(path) {
					var parts = path.split('.');
					var desc_key = _.last(parts);
					//console.log(desc_key);
					if (desc_key === key) {
						var obj = getObject(path, false, clazz);
						//console.log(JSON.stringify(description, false, 4));
						obj['description'] += '\n\n' + value;
						//desc.obj['description'] += '\n\n' + value;
					}
				});
			});

			return true;
		});
	};


	//finds the use of jsdoc longNames in descriptions and replaces them with links
	//example: joss.mvc.Controller#bind -> [Controller.bind](link to joss.mvc.Controller#bind)
	var transformLongNames = function(graph) {

		//turn '.' in property names to '/' so we can use getObject to traverse
		_.every(graph, function(child, key) {
			if (key.search(/\./g) !== -1) {
				graph[key.replace(/\./g, '/')] = graph[key];
				delete graph[key];
			}
		});

		var descriptions = _getDescriptions(graph);

		descriptions.forEach(function(path) {
			var obj = getObject(path, false, graph);
			var desc = obj['description'];

			_.each(typeMap, function(type) {
				var sLongName = type.longName + '[#\\.]([a-zA-Z_]+)';
				var rLongName = new RegExp(sLongName);
				var rLongNameGlobal = new RegExp(sLongName, 'g');
				if (desc.search(rLongNameGlobal) !== -1) {
					//global matching will disregard capturing groups, so
					//capture the full matches and then iterate over all of
					//them, matching again.
					var matches = desc.match(rLongNameGlobal);
					matches.forEach(function(match) {
						var submatches = match.match(rLongName);
						var longName = submatches[0];
						var name = submatches[1];
						desc = desc.replace(new RegExp(longName, 'g'), '<a href="#" rel="' + longName + '">' + type.name + '.' + name + '</a>');
					});
					obj['description'] = desc;
				}
			});
		});

		//set '/' in property names back to '.'
		_.every(graph, function(child, key) {
			if (key.search(/\//g) !== -1) {
				graph[key.replace(/\//g, '.')] = graph[key];
				delete graph[key];
			}
		});
	};


	var parseMarkdown = function(graph) {
		_.each(graph, function(clazz) {
			_.every(clazz, function(type, key) {
				if ((key === 'module' || key === 'constructor') && type.description) {
					type.description = md.parse(type.description);
					return true;
				}

				_.each(type, function(member) {
					if (member.description) {
						member.description = md.parse(member.description);
					}
				});

				return true;
			});
		});
	};


	var classTpl;

	var renderClass = function(graph, path, callback) {
		classTpl = classTpl || grunt.file.read(docdir + '/tpl/class.jade', 'utf-8');
		//console.log(JSON.stringify(graph, false, 4));
		var data = jade.compile(classTpl)({cl: graph, module: path});
		callback(graph, path, data);
	};

	var tagListTpl;

	var renderTagList = function(graph, path, callback) {
		tagListTpl = tagListTpl || grunt.file.read(docdir + '/tpl/taglist.jade', 'utf-8');
		var data = jade.compile(tagListTpl)({cl: graph, module: path});
		callback(graph, path, data);
	};


	var renderMenu = function(obj) {
		if (_.isString(obj)) {
			return '';
		}

		//console.log(obj);
		var html = '<ul>';
		_.every(obj, function(child, key) {

			if (_.isString(_.values(obj)[0])) {
				html += '<li>';
				html += '<a href="#" data-class="' + child + '">' + key + '</a>';
				return true;
			}
			else {
				html += '<li>' + key;
			}

			html += renderMenu(child);
			html += '</li>';

			return true;
		});
		html += '</ul>';
		return html;
	};



	//idea: put a search box above class list that filters the class list


	grunt.registerTask('doc', 'Runs requirejs optimizer', function() {
		var config = grunt.config.get(this.name);
		var done = this.async();

		var files = grunt.file.expandFiles(config.path);
		grunt.log.write('Running jsdoc...');
		async.map(files, function(path, callback) {
			grunt.verbose.writeln('Running jsdoc on ' + path + '...');
			child.exec(libdir + '/jsdoc/jsdoc -X ' + path, {maxBuffer: 2000000}, function(error, stdout, stderr) {
				grunt.verbose.ok('jsdoc on ' + path + ' DONE');
				callback(null, stdout);
			});
		}, function(err, result) {

			var graph = {};
			_.each(result, function(json) {
				json = json.replace(/<Object>/gm, "\"Object\"");
				json = json.replace(/:\sundefined/gm, ": \"undef\"");
				//console.log(json);
				graph = JSON.parse(json).concat(graph);
			});

			//console.log(JSON.stringify(graph, false, 4));

			grunt.log.write('Parsing jsdoc output...');
			graph = processJsDoc(graph);
			grunt.log.ok();

			//console.log(JSON.stringify(graph, false, 4));

			grunt.log.write('Mixing in markdown documentation...');
			mixinMarkdown(graph);
			grunt.log.ok();

			grunt.log.write('Transforming references to defined methods into links...');
			transformLongNames(graph);
			grunt.log.ok();

			grunt.log.write('Parsing markdown in member descriptions...');
			parseMarkdown(graph);
			grunt.log.ok();


			grunt.log.write('Rendering class definition files into ' + docdir + '/out/classes...');
			_.each(graph, function(val, key) {
				if (!key) {
					return true; //continue
				}

				var path = key.replace(/\./g, '/');
				grunt.verbose.write('Rendering class definition file ' + path + '...');
				//console.log(path);
				//console.log(val);
				renderClass(val, path, function(graph, path, data) {
					var filePath = docdir + '/out/classes/' + path + '.html';
					grunt.file.write(filePath, data, 'utf-8');
				});
				grunt.verbose.ok();
			});


			grunt.log.write('Rendering taglist files into ' + docdir + '/out/taglists...');
			_.each(graph, function(val, key) {
				if (!key) {
					return true; //continue
				}

				var path = key.replace(/\./g, '/');
				grunt.verbose.write('Rendering taglist file ' + path + '...');
				//console.log(path);
				//console.log(val);
				renderTagList(val, path, function(graph, path, data) {
					var filePath = docdir + '/out/taglists/' + path + '.html';
					grunt.file.write(filePath, data, 'utf-8');
				});
				grunt.verbose.ok();
			});


			grunt.verbose.write('Rendering menu...');
			var classList = Object.keys(graph);
			var classStructure = {};
			_.each(classList, function(className) {
				setObject(className, className, classStructure);
			});

			var menu = renderMenu(classStructure, '');
			grunt.file.write(docdir + '/out/menu.html', menu, 'utf-8');
			grunt.verbose.ok();
			grunt.log.ok();

			done();
		});

	});


};
