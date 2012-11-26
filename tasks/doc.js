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

	function populateTypeMap(types) {
		_.each(types, function(type) {
			typeMap[type.longName || type.name || type.regexp] = type;
		});
	}

	['Number', 'String', 'Object', 'Function', 'Array', 'RegExp', 'Boolean'].forEach(function(val) {
		typeMap[val] = {
			name: val,
			link: 'https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/' + val
		};
	});

	typeMap['void'] = {
		name: 'void',
		link: 'https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/undefined'
	};

	typeMap['Element'] = {
		name: 'Element',
		link: 'https://developer.mozilla.org/en-US/docs/DOM/element'
	};

	function getTypes(names, create) {
		if (!names) {
			return [typeMap['void']];
		}

		var types = [];
		names.forEach(function(name) {
			//first try the fast dictionary approach for perfect String matches
			if (typeMap[name]) {
				types.push(typeMap[name]);
				return true;
			}

			var foundMatch = false;

			//next try types specified as RegExp objects, matching
			//against the provided name
			_.every(typeMap, function(type) {
				if (!type.regexp) {
					return true;
				}

				if (name.search(type.regexp) !== -1) {
					types.push({
						name: name,
						longName: name,
						link: name.replace(type.regexp, type.link)
					});
					foundMatch = true;
					return false;
				}

				return true;
			});

			if (foundMatch) {
				return true;
			}

			if (create === false) {
				return true;
			}

			//a class, not a method/member
			if (name.search(/[#~\.]/g) === -1) {
				console.log('WARNING: The type ' + name + ' was not declared anywhere in the project. Documentation will not present a link.');
			}

			types.push({
				name: name,
				longName: name,
				link: '/#/' + name
			});
		});

		return types;
	}


	function _fileToModuleName(filePath) {
		var srcDirectory = path.resolve(process.cwd() + '/' + rjsconfig.baseUrl);
		var absolutePath = path.resolve(process.cwd() + '/' + filePath);

		filePath = filePath.replace(/\.js/, '');

		return absolutePath.replace(srcDirectory + '/', '').replace('.js', '');
	}


	var processJsDoc = function(json, meta) {

		var db = taffy(json);


		db({undocumented: true}).remove();


		db().each(function(record) {
			record.lineno = record && record.meta && record.meta.lineno;

			if (record && record.meta && record.meta.path) {
				var fileName = record.meta.path + '/' + record.meta.filename;
				record.module = _fileToModuleName(fileName);
			}
		});


		db({longname: {'like': '<anonymous>'}}).each(function(record) {
			if (record.module) {
				record.longname = record.longname.replace('<anonymous>', record.module);
				record.name = record.longname.match(/.*~(.*)$/).pop();
			}
		});


		db({kind: ['class', 'namespace']}).each(function(record) {
			//collect a map of longnames to short aliases for classes, to be used when
			//printing parameters and return types
			if (record.name.search(/\//g) !== -1) {
				record.name = record.longname.match(/.*\/(.*)$/).pop();
			}
			var className = record.name;
			var classLongName = record.longname;
			typeMap[classLongName] = {
				userDefined: true,
				longName: classLongName,
				name: className,
				link: '/#/' + classLongName
			};
		});


		//see if items in the dependency array are in the type map (for linking
		//in final documentation)
		_.each(meta, function(value) {
			_.each(value.deps, function(dep) {
				var type = getTypes([dep.path], false);
				if (type && type.length) {
					dep.link = type[0].link;
				}
			});
		});


		var graph = {};
		db({kind: ['class', 'namespace']}).each(function(record) {

			var module = record.module;

			record.description = record.description || '';

			graph[module] = {};
			graph[module]['meta'] = meta[module];
			graph[module]['constructor'] = {};
			graph[module]['properties'] = {};
			graph[module]['methods'] = {};
			graph[module]['jquery'] = {};

			if (record.kind === 'class') {
				var constructor = graph[module]['constructor'] = record;
				constructor.longName = constructor.longname;
				constructor.link = getTypes([constructor.longName])[0].link;
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
			}


			db({kind: 'member'}, {module: module}).each(function(record) {
				var member = graph[module]['properties'][record.name] = record;
				member.longName = member.longname;
				member.link = getTypes([member.longname])[0].link;
				member.types = member.type ? getTypes(member.type.names) : getTypes(null);
				member.description = member.description || '';
			});


			db({kind: 'function'}, {module: module}).each(function(record) {
				//console.log(JSON.stringify(record, null, 4));
				var method;

				if (record.longname.search(/\$\.fn/g) !== -1) {
					method = graph[module]['jquery'][record.name] = record;
					method.scope = ''; //avoid 'static' qualifier
				}
				else {
					method = graph[module]['methods'][record.name] = record;
				}

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

				//accessor (get/set) detection, for nicer display than, for example, Number|Rect width([Number w])
				if (method.params.length === 1 && method.returns.types.length === 2 && method.returns.types.filter(function(type) {
					return type.longName === method.params[0].types[0].longName;
				}).length === 1) {
					var getType = method.params[0].types[0];
					var setReturnType;

					method.returns.types.forEach(function(type) {
						if (type.longName !== method.params[0].types[0].longName) {
							setReturnType = type;
						}
					});

					method.get = {
						name: method.name,
						params: [],
						returns: {
							types: [getType]
						}
					};

					method.set = {
						name: method.name,
						params: [{
							name: method.params[0].name,
							optional: false,
							types: [getType]
						}],
						returns: {
							types: [setReturnType]
						}
					};
				}

			});

		});

		//console.log(JSON.stringify(graph, false, 4));

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
			//var name = path.replace(/\//g, '.');
			var clazz = graph[path];

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
					//console.log(path);
					var parts = path.split('.');
					var desc_key = _.rest(parts).join('.');
					//console.log(desc_key);
					if (desc_key === key) {
						var obj = getObject(path, false, clazz);
						obj.description = obj.description || '';
						//console.log(JSON.stringify(description, false, 4));
						obj.description += '\n\n' + value;
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
		/*
		 *_.every(graph, function(child, key) {
		 *    if (key.search(/\./g) !== -1) {
		 *        graph[key.replace(/\./g, '/')] = graph[key];
		 *        delete graph[key];
		 *    }
		 *    return true;
		 *});
		 */

		var descriptions = _getDescriptions(graph);
		//console.log(descriptions);

		descriptions.forEach(function(path) {
			//console.log(path);
			var obj = getObject(path, false, graph);

			if (!obj) {
				return true;
			}

			var desc = obj['description'];

			_.each(typeMap, function(type) {
				if (!type.longName) {
					return true;
				}

				//first, class name + member name
				var sLongName = '{' + type.longName + '[#\\.]([a-zA-Z_]+)}';
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
						desc = desc.replace(rLongName, '<a href="/#/' + longName.replace(/\{/g, '').replace(/\}/g, '').replace(/\./g, '/') + '">' + type.name + '.' + name + '</a>');
					});
				}

				//then, just plain class names (no member name following)
				var rClassName = new RegExp('{' + type.longName + '}', 'g');
				//console.log(type.longName);
				desc = desc.replace(rClassName, ' <a href="' + type.link + '">' + type.name + '</a>');
			});

			obj['description'] = desc;
		});

		//set '/' in property names back to '.'
		/*
		 *_.every(graph, function(child, key) {
		 *    if (key.search(/\//g) !== -1) {
		 *        graph[key.replace(/\//g, '.')] = graph[key];
		 *        delete graph[key];
		 *    }
		 *});
		 */
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

	var renderModule = function(graph, path, config, callback) {
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
		_.every(Object.keys(obj).sort(), function(key) {
			var child = obj[key];

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


	grunt.registerTask('doc', 'Runs jsdoc', function() {
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

		populateTypeMap(config.types || []);

		requirejs(['../dist/lib/parse'], function(parse) {

			var files = config.include;
			grunt.log.write('Running jsdoc...');
			async.map(files, function(path, callback) {
				grunt.verbose.writeln('Running jsdoc on ' + path + '...');
				var contents = grunt.file.read(path);
				child.exec(libdir + '/jsdoc/jsdoc -X ' + path, {maxBuffer: 2000000}, function(error, stdout, stderr) {
					//console.log(stdout);
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

				//console.log(JSON.stringify(graph, false, 4));

				grunt.log.write('Transforming references to defined methods into links...');
				transformLongNames(graph);
				grunt.log.ok();

				grunt.log.write('Parsing markdown in member descriptions...');
				parseMarkdown(graph);
				grunt.log.ok();


				grunt.log.write('Rendering module definition files into ' + docdir + '/out/classes...');
				_.each(graph, function(val, key) {
					if (!key) {
						return true; //continue
					}

					//var path = key.replace(/\./g, '/');
					grunt.verbose.write('Rendering class definition file ' + path + '...');
					//console.log(path);
					//console.log(val);
					renderModule(val, key, config, function(graph, path, data) {
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

					//var path = key.replace(/\./g, '/');
					grunt.verbose.write('Rendering taglist file ' + path + '...');
					//console.log(path);
					//console.log(val);
					renderTagList(val, key, function(graph, path, data) {
						var filePath = docdir + '/out/taglists/' + path + '.html';
						grunt.file.write(filePath, data, 'utf-8');
					});
					grunt.verbose.ok();
				});
				grunt.log.ok();


				grunt.verbose.write('Rendering menu...');
				var classList = _.clone(Object.keys(graph));
				var classStructure = {};
				_.each(classList, function(className) {
					var path = className.replace(/\//g,'.');
					setObject(path, className, classStructure);
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
