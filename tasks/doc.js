module.exports = function(grunt) {
	'use strict';

	var docdir = 'doc';
	var libdir = 'doc/lib';

	var path = require('path');
	var child = require("child_process");
	var _ = grunt.utils._;

	var taffy = require("../doc/lib/taffy.js").taffy;
	var jade = require('jade');
	var md = require('marked');
	var hljs = require('highlight.js');
	var async = require('async');

	var requirejs = require('../dist/lib/r.js');
	var rjsconfig = require('./rjsconfig.js');

	requirejs.config({
		baseUrl: __dirname,
		nodeRequire: require
	});




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

	typeMap['require'] = {
		longName: 'require',
		name: 'require',
		link: 'http://requirejs.org/'
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

			//a class, not a method/member
			if (name.search(/#/g) === -1) {
				console.log('WARNING: The type ' + name + ' was not declared anywhere in the project. Documentation will not present a link.');
			}

			types.push({
				name: name,
				longName: name,
				link: '/#/' + name.replace(/\./g, '/')
			});
		});

		return types;
	}


	var processJsDoc = function(json, meta) {

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
				link: '/#/' + classLongName.replace(/\./g, '/')
			};
		});

		//see if items in the dependency array are in the type map (for linking
		//in final documentation)
		_.each(meta, function(value) {
			_.each(value.deps, function(dep) {
				var type = typeMap[dep.path.replace(/\//g, '.')];
				if (type) {
					dep.link = type.link;
				}
			});
		});


		var graph = {};
		db({kind: ['class']}).each(function(record) {

			var classLongName = record.longname;

			record.description = record.description || '';

			graph[classLongName] = {};
			graph[classLongName]['meta'] = meta[classLongName];
			graph[classLongName]['constructor'] = record;
			graph[classLongName]['properties'] = {};
			graph[classLongName]['methods'] = {};

			var constructor = graph[classLongName]['constructor'];
			constructor.longName = constructor.longname;
			constructor.link = getTypes([constructor.longname])[0].link;
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
				member.link = getTypes([member.longname])[0].link;
				member.types = member.type ? getTypes(member.type.names) : getTypes(null);
				member.description = member.description || '';
			});


			db({kind: 'function'}, {memberof: classLongName}).each(function(record) {
				//console.log(JSON.stringify(record, null, 4));
				var method = graph[classLongName]['methods'][record.name] = record;
				method.longName = method.longname;
				method.link = getTypes([method.longname])[0].link;
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
		//console.log(descriptions);

		descriptions.forEach(function(path) {
			var obj = getObject(path, false, graph);

			if (!obj) {
				return true;
			}

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
						desc = desc.replace(new RegExp(longName, 'g'), '<a href="/#/' + longName + '" rel="' + longName + '">' + type.name + '.' + name + '</a>');
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
					if (member && member.description) {
						member.description = md.parse(member.description);
					}
				});

				return true;
			});
		});
	};


	var classTpl;

	var renderClass = function(graph, path, config, callback) {
		classTpl = classTpl || grunt.file.read(docdir + '/tpl/class.jade', 'utf-8');
		//console.log(JSON.stringify(graph, false, 4));
		var data = jade.compile(classTpl)({cl: graph, module: path, config: config});
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
				var type = getTypes([child])[0];
				html += '<li>';
				html += '<a href="' + type.link + '#SOverview">' + key + '</a>';
				return true;
			}
			else {
				html += '<li><span class="section-header">' + key + '</span>';
			}

			html += renderMenu(child);
			html += '</li>';

			return true;
		});
		html += '</ul>';
		return html;
	};



	//idea: put a search box above class list that filters the class list
	
	//------------------------------------------------------------
	// Transform globbed config values into lists of files
	//------------------------------------------------------------
	var _expanded = function(arr) {
		var files = [];
		arr.forEach(function(val) {
			files = files.concat(grunt.file.expandFiles(val));
		});
		return _.uniq(files);
	};


	grunt.registerTask('doc', 'Runs requirejs optimizer', function() {
		var config = grunt.config.get(this.name);
		var done = this.async();

		['include', 'exclude'].forEach(function(name) {
			config[name] = config[name] || [];
			if (_.isString(config[name])) {
				config[name] = [config[name]];
			}
			config[name] = _expanded(config[name]);
		});

		config.include = _.difference(config.include, config.exclude);

		requirejs(['../dist/lib/parse'], function(parse) {

			var files = config.include;
			grunt.log.write('Running jsdoc...');
			async.map(files, function(path, callback) {
				grunt.verbose.writeln('Running jsdoc on ' + path + '...');
				var contents = grunt.file.read(path);
				child.exec(libdir + '/jsdoc/jsdoc -X ' + path, {maxBuffer: 2000000}, function(error, stdout, stderr) {
					grunt.verbose.ok('jsdoc on ' + path + ' DONE');
					var deps;
					try {
						deps = parse.findDependencies(path, contents);
					}
					catch(e) {
						deps = [];
					}
					callback(null, {
						path: path,
						deps: deps,
						json: stdout
					});
				});
			}, function(err, resultList) {

				var meta = {};
				var graph = [];
				_.each(resultList, function(result) {
					var json = result.json;
					//strip out error-causing lines
					json = json.replace(/<Object>/gm, "\"Object\"");
					json = json.replace(/:\sundefined/gm, ": \"undef\"");

					//resolve requirejs dependencies relative to src path
					//(as opposed to relative to the file in which they're require'd)
					var resultDirectory = path.resolve(process.cwd() + '/' + _.initial(result.path.split('/')).join('/'));
					var srcDirectory = path.resolve(process.cwd() + '/' + rjsconfig.baseUrl);
					result.deps = result.deps.map(function(depPath) {
						depPath = depPath.replace(/\.js/, '');
						var absolutePath;

						//directory-relative path
						if (depPath.search(/^\.\.\//g) !== -1 || depPath.search(/^\.\//) !== -1) {
							absolutePath = path.resolve(resultDirectory + '/' + depPath + '.js');
							return absolutePath.replace(srcDirectory + '/', '').replace('.js', '');
						}

						absolutePath = path.resolve(srcDirectory + '/' + depPath + '.js');
						return absolutePath.replace(srcDirectory + '/', '').replace('.js', '');
					});

					result.deps = result.deps.map(function(depPath) {
						return {
							path: depPath,
							link: ''
						};
					});

					//collect meta information like class -> file name and
					//class -> dependencies. We'll apply it to `graph` inside
					//processJsDoc()
					var clazz = JSON.parse(json);
					clazz.every(function(item) {
						if (item.kind && item.kind === 'class') {
							meta[item.longname] = {
								filename: result.path,
								deps: result.deps
							};
							return false; //break;
						}
						return true;
					});
					//console.log(json);
					graph = graph.concat(clazz);
				});

				//console.log(JSON.stringify(graph, false, 4));

				grunt.log.write('Parsing jsdoc output...');
				graph = processJsDoc(graph, meta);
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
					renderClass(val, path, config, function(graph, path, data) {
						var filePath = docdir + '/out/classes/' + path + '.html';
						grunt.file.write(filePath, data, 'utf-8');
					});
					grunt.verbose.ok();
				});
				grunt.log.ok();


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
				grunt.log.ok();


				grunt.verbose.write('Rendering menu...');
				var classList = Object.keys(graph);
				var classStructure = {};
				_.each(classList, function(className) {
					className = className.replace(/\//g,'.');
					setObject(className, className, classStructure);
				});

				var menu = renderMenu(classStructure, '');
				grunt.file.write(docdir + '/out/menu.html', menu, 'utf-8');
				grunt.verbose.ok();
				grunt.log.ok();

				done();
			});

		}); //requirejs parse

	});


};
