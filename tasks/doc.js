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
	var util = require('./util.js');

	var requirejs = require('../dist/lib/r.js');
	var rjsconfig = require('./rjsconfig.js');


	//track names which *should* be documented (assigned in _processJsdoc) and
	//compare against what was actually documented (_checkMissingDocumentation)
	var documentedNames = {};
	var undocumentedNames = [];



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

		_.each(typeMap, function(type) {
			if (!type.longName) {
				type.longName = type.name;
			}
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

	var missingNames = {};

	function getTypes(names, create) {
		if (!names) {
			return [typeMap['void']];
		}

		if (!_.isArray(names)) {
			names = [names];
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
						name: name.replace(type.regexp, '$1'),
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
			if (name.search(/[#~\.]/g) === -1 && !missingNames[name]) {
				missingNames[name] = true;
				grunt.log.subhead('WARNING: The type ' + name + ' was not declared anywhere in the project. Documentation will not present a link.');
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


		db({kind: ['class', 'namespace']}).each(function(record) {
			var className = record.longname;
			db({undocumented: true, memberof: className}).each(function(record) {
				undocumentedNames.push({
					name: record.longname,
					file: record.meta.path + '/' + record.meta.filename + ':' + record.meta.lineno
				});
			});
		});


		db({undocumented: true}).remove();


		db().each(function(record) {
			record.lineno = record && record.meta && record.meta.lineno;

			if (record && record.meta && record.meta.path) {
				var fileName = record.meta.path + '/' + record.meta.filename;
				record.module = _fileToModuleName(fileName);
			}
		});


		//reassign 'anonymous'-scoped variables to their module's scope (from the file name)
		db({longname: {'like': '<anonymous>'}}).each(function(record) {
			if (record.module) {
				//convention: 'anonymous' variables under the same name as the
				//module/class's short name are static members of that class
				var moduleShortName = record.module.match(/.*\/(.*)$/).pop();
				if (record.longname.search(new RegExp('<anonymous>~' + moduleShortName)) !== -1) {
					record.longname = record.longname.replace('<anonymous>~' + moduleShortName, record.module);
					return; //continue
				}

				record.longname = record.longname.replace('<anonymous>', record.module);
				record.name = record.longname.match(/.*~(.*)$/).pop();
			}
		});


		//collect a map of longnames to short aliases for classes, to be used
		//when printing parameters and return types
		db({kind: ['class', 'namespace']}).each(function(record) {
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


		db().each(function(record) {
			if (!record.longname) {
				return true;
			}

			documentedNames[record.longname] = true;
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
/*
 *                if (method.params.length === 1 && method.returns.types.length === 2 && method.returns.types.filter(function(type) {
 *                    return type.longName === method.params[0].types[0].longName;
 *                }).length === 1) {
 *                    var getType = method.params[0].types[0];
 *                    var setReturnType;
 *
 *                    method.returns.types.forEach(function(type) {
 *                        if (type.longName !== method.params[0].types[0].longName) {
 *                            setReturnType = type;
 *                        }
 *                    });
 *
 *                    method.get = {
 *                        name: method.name,
 *                        params: [],
 *                        returns: {
 *                            types: [getType]
 *                        }
 *                    };
 *
 *                    method.set = {
 *                        name: method.name,
 *                        params: [{
 *                            name: method.params[0].name,
 *                            optional: false,
 *                            types: [getType]
 *                        }],
 *                        returns: {
 *                            types: [setReturnType]
 *                        }
 *                    };
 *                }
 */

			});

		});


		//console.log(JSON.stringify(graph, false, 4));

		return graph;

	};


	//returns an Array of Objects inside `obj` which contain a 'description' key
	var _getDescriptions = function(obj) {
		var ret = [];

		if (!_.isObject(obj)) {
			return ret;
		}

		_.each(obj, function(child, key) {
			if (key === 'description' && obj.kind) {
				ret.push(obj);
			}
			ret = ret.concat(_getDescriptions(child));
		});

		return ret;
	};


	var markdownDocumentedNames = [];

	var mixinMarkdown = function(graph) {
		var mixins = grunt.file.expandFiles(docdir + '/mixin/**');

		mixins.every(function(path) {
			var mixin = grunt.file.read(path);

			var moduleName = path.replace(docdir + '/mixin/', '').replace('.md', '');
			//var name = path.replace(/\//g, '.');
			var clazz = graph[moduleName];

			if (!clazz) {
				return true;
			}

			//console.log(JSON.stringify(clazz, false, 4));

			//mixin = mixin.replace(/^`*js$/gm, '```');
			//console.log(mixin);

			//parse markdown "mixin" file for h2's "## [memberName]"
			var mixinParts = mixin.split(/^(##\s*\S*)$/gm);

			//first description in the file is the module description, if no
			//"%[memberName]" declaration exists before it
			if (mixinParts.length && mixinParts[0].search(/^##\s*\S*$/) === -1) {
				clazz['module'] = {};
				clazz['module']['description'] = mixinParts[0];
			}

			var mixinGraph = {};
			for (var i = 0, l = mixinParts.length; i < l; i++) {
				var part = mixinParts[i];
				if (part.search(/^##\s*\S*$/) !== -1 && mixinParts[i+1]) {
					mixinGraph[part.replace(/##\s*/, '')] = mixinParts[i+1];
				}
			}
			//console.log(JSON.stringify(mixinGraph, false, 4));

			var descriptions = _getDescriptions(clazz);
			//console.log(JSON.stringify(Object.keys(descriptions), false, 4));

			_.each(mixinGraph, function(value, key) {
				_.each(descriptions, function(obj) {
					var shortName;
					if (obj.longName === moduleName) {
						shortName = 'constructor';
					}
					else {
						shortName = obj.name;
					}

					if (shortName === key) {
						obj.description = value;
						markdownDocumentedNames.push(obj.longName);
					}
				});
			});

			return true;
		});

	};


	//finds the use of jsdoc longNames in descriptions and replaces them with links
	//example: joss.mvc.Controller#bind -> [Controller.bind](link to joss.mvc.Controller#bind)
	var transformLongNames = function(graph) {

		var descriptions = _getDescriptions(graph);
		//console.log(descriptions);

		_.each(descriptions, function(obj) {

			var description = obj.description;

			_.each(typeMap, function(type) {
				if (!type.longName) {
					return true;
				}

				//first, class name + member name
				var sLongName = '{' + type.longName + '[#~\\.]([a-zA-Z_]+)}';
				var rLongName = new RegExp(sLongName);
				var rLongNameGlobal = new RegExp(sLongName, 'g');
				if (description.search(rLongNameGlobal) !== -1) {
					//global matching will disregard capturing groups, so
					//capture the full matches and then iterate over all of
					//them, matching again.
					var matches = description.match(rLongNameGlobal);
					matches.forEach(function(match) {
						var submatches = match.match(rLongName);
						var longName = submatches[0];
						var name = submatches[1];
						description = description.replace(rLongName, '<a href="/#/' + longName.replace(/\{/g, '').replace(/\}/g, '') + '">' + type.name + '.' + name + '</a>');
					});
				}

				//then, just plain class names (no member name following)
				var rClassName = new RegExp('{' + type.longName + '}', 'g');
				//console.log(type.longName);
				description = description.replace(rClassName, ' <a href="' + type.link + '">' + type.name + '</a>');
			});

			obj.description = description;
		});

	};


	//only single inheritance for now. Since dojo/_base/declare supports multiple inheritance:
	//TODO: use dojo's C3 MRO code to build a list of base classes
	var mixinInherited = function(graph) {

		// C3 Method Resolution Order
		// lifted from dojo/_base/declare and altered for our limited case
		var _c3mro = function(bases, className){
			var result = [], roots = [{cls: 0, refs: []}], nameMap = {}, clsCount = 1,
				l = bases.length, i = 0, j, lin, base, top, rec, name, refs;

			//console.log('C3: ' + className);

			// build a list of bases naming them if needed
			for(; i < l; ++i){
				base = bases[i];
				//console.log('base: ' + base.name);
				lin = base._meta ? base._meta.bases : [base];
				//lin = base.bases;
				/*
				 *lin.forEach(function(val) {
				 *    console.log('lin: ' + val.name);
				 *});
				 */
				top = 0;
				// add bases to the name map
				for(j = lin.length - 1; j >= 0; --j){
					name = lin[j].name;
					//console.log('get here 2: ' + name);
					//console.log('got here: ' + name);
					if(!nameMap.hasOwnProperty(name)){
						nameMap[name] = {count: 0, refs: [], cls: lin[j]};
						++clsCount;
					}
					rec = nameMap[name];
					if(top && top !== rec){
						rec.refs.push(top);
						++top.count;
					}
					top = rec;
					//console.log(JSON.stringify(top, false, 4));
				}
				++top.count;
				roots[0].refs.push(top);
			}

			//console.log(JSON.stringify(nameMap, false, 4));

			// remove classes without external references recursively
			while(roots.length){
				top = roots.pop();
				result.push(top.cls);
				--clsCount;
				// optimization: follow a single-linked chain
				while(refs = top.refs, refs.length == 1){
					top = refs[0];
					if(!top || --top.count){
						// branch or end of chain => do not end to roots
						top = 0;
						break;
					}
					result.push(top.cls);
					--clsCount;
				}
				if(top){
					// branch
					for(i = 0, l = refs.length; i < l; ++i){
						top = refs[i];
						if(!--top.count){
							roots.push(top);
						}
					}
				}
			}
			if(clsCount){
				console.error("can't build consistent linearization", className);
			}

			// calculate the superclass offset
			base = bases[0];
			/*
			 *result[0] = base ?
			 *    base._meta && base === result[result.length - base._meta.bases.length] ?
			 *        base._meta.bases.length : 1 : 0;
			 */
			if (!base) {
				result[0] = 0;
			}
			else if (base.bases && base === result[result.length - base.bases.length]) {
				result[0] = base.bases.length;
			}
			else {
				result[0] = 1;
			}

			if (result.length === 1) {
				return [];
			}
			else {
				return result.slice(1);
			}

		};


		//a simplied class graph containing only inheritance info
		var inheritanceGraph = (function() {
			var result = {};
			//start by just defining placeholders for each class
			_.each(graph, function(obj, className) {
				result[className] = {
					name: className,
					_meta: {},
					bases: []
				};
			});

			var requiresMissing = false;

			//add inheritance info
			_.each(graph, function(obj, className) {
				if (obj.constructor.augments) {
					obj.constructor.augments.forEach(function(superclassName) {
						if (!graph[superclassName]) {
							grunt.log.subhead('WARNING: ' + superclassName + ' declared as a superclass of ' + className + ', but does not exist or was not included in grunt option doc.include. Inheritance info will not be written out.');
							requiresMissing = true;
						}
						result[className].bases.push(result[superclassName]);
					});
				}
			});

			//we cannot determine all inheritance info with a missing
			//superclass. skip the rest.
			if (requiresMissing) {
				return {};
			}

			var _depth = function(base, depth) {
				depth = depth || 0;

				if (!base || !base.bases || !base.bases.length) {
					return depth;
				}

				depth++;

				var childDepth = [];
				base.bases.forEach(function(child, i) {
					childDepth[i] = _depth(child, depth);
				});
				return _.max(childDepth);
			};

			//sort by number of superclasses
			var sorted = _.chain(result).values().sortBy(function(obj) {
				return _depth(obj);
			}).map(function(obj) {
				return obj.name;
			}).value();

			//console.log(JSON.stringify(sorted, false, 4));

			//expand bases out to full hierarchy/linearize
			_.each(sorted, function(className) {
				if (!result[className].bases.length) {
					result[className]._meta.bases = [result[className]];
					result[className].isTop = true;
				}
				else {
					result[className]._meta.bases = _c3mro(result[className].bases, className);
					result[className]._meta.bases.unshift(result[className]);
				}
			});

			//console.log(JSON.stringify(result, false, 4));

			var ret = {};
			_.each(result, function(obj, className) {
				ret[className] = {
					name: className,
					bases: []
				};
				obj._meta.bases.forEach(function(base) {
					ret[className].bases.push(base.name);
				});
				/*
				 *console.log('--' + className);
				 *obj._meta.bases.forEach(function(base) {
				 *    if (base.name) {
				 *        console.log(base.name);
				 *    }
				 *    else {
				 *        console.log(base);
				 *    }
				 *});
				 */
			});

			return ret;
		})();

		//console.log(JSON.stringify(inheritanceGraph, false, 4));

		//sort inheritanceGraph by number of superclasses, and override subclasses
		//methods in-order
		_.chain(inheritanceGraph).values().sortBy(function(obj) {
			return -1 * obj.bases.length;
		}).value().forEach(function(obj) {
			var clazz = graph[obj.name];
			var className = obj.name;

			//order from highest ancestor -> self
			obj.bases = obj.bases.reverse();
			//last entry is the class itself. remove.
			obj.bases.pop();

			clazz.extends = clazz.constructor.augments;

			var ownProps = {};
			['methods', 'properties'].forEach(function(type) {
				_.each(clazz[type], function(val, key) {
					ownProps[key] = true;
				});
			});

			obj.bases.forEach(function(superclassName) {
				var superclass = graph[superclassName];
				['methods', 'properties'].forEach(function(type) {
					_.each(superclass[type], function(prop, key) {
						//inherited (not defined on clazz)
						if (!ownProps[key]) {
							var oldDescription = (clazz[type][key] && clazz[type][key].description);
							clazz[type][key] = _.clone(prop);
							if (oldDescription) {
								clazz[type][key].description = oldDescription;
							}
							clazz[type][key].inherited = {
								name: getTypes(superclassName)[0].name,
								longName: getTypes(prop.longName)[0].longName,
								link: getTypes(prop.longName)[0].link
							};
							clazz[type][key].link = prop.link.replace(superclassName, className);
							clazz[type][key].longName = prop.longName.replace(superclassName, className);
						}
						//overridden
						else {
							clazz[type][key].overridden = {
								name: getTypes(superclassName)[0].name,
								longName: getTypes(prop.longName)[0].longName,
								link: getTypes(prop.longName)[0].link
							};
							clazz[type][key].description = clazz[type][key].description || prop.description;
						}
					});
				});
			});
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
	grunt.registerTask('doc', 'Runs jsdoc', function() {
		var config = grunt.config.get(this.name);
		var done = this.async();

		['include', 'exclude'].forEach(function(name) {
			config[name] = util.expand(config[name]);
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

				grunt.log.write('Mixing inherited methods into class definitions...');
				mixinInherited(graph);
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


				grunt.log.subhead('Documentation Coverage');
				grunt.log.writeln('Use --verbose to see the names of all undocumented variables');
				grunt.log.writeln('============================================================');

				//calculate documentation coverage
				var docFileMap = {};
				var docTotal = _getDescriptions(graph).map(function(obj) {
					if (!obj.inherited) {
						docFileMap[obj.longName] = obj.meta.path + '/' + obj.meta.filename + ':' + obj.meta.lineno;
						return obj.longName;
					}
					return '';
				});

				docTotal = _.chain(docTotal).compact().uniq().value();

				var mdownMissing = _.difference(docTotal, markdownDocumentedNames);
				grunt.log.subhead('Markdown description coverage: ' + markdownDocumentedNames.length + ' of ' + docTotal.length + ' (' + ((markdownDocumentedNames.length / docTotal.length) * 100).toFixed(1) + '%)');
				grunt.verbose.writeln('The following variables have no markdown documentation:');
				grunt.verbose.writeln('');
				mdownMissing.sort().forEach(function(name) {
					grunt.verbose.writeln(name + ' (' + docFileMap[name] + ')');
				});

				var docPresent = _getDescriptions(graph).map(function(obj) {
					if (obj.description && obj.description.trim() && !obj.inherited) {
						return obj.longName;
					}
					return '';
				});

				docPresent = _.chain(docPresent).compact().uniq().value();

				var docMissing = _.difference(docTotal, docPresent);
				grunt.log.subhead('All description coverage: ' + docPresent.length + ' of ' + docTotal.length + ' (' + ((docPresent.length / docTotal.length) * 100).toFixed(1) + '%)');
				grunt.verbose.writeln('The following variables have no descriptions (inherited or otherwise):');
				grunt.verbose.writeln('');
				docMissing.sort().forEach(function(name) {
					grunt.verbose.writeln(name + ' (' + docFileMap[name] + ')');
				});

				undocumentedNames = undocumentedNames.filter(function(obj) {
					//remove private-ish names and proven-documented names (jsdoc will count all usages of a property as separate undocumented cases)
					return (obj.name.search(/.*[#.][_'"]/) === -1)
						&& (!documentedNames[obj.name])
						&& (obj.name.search(/~/g) === -1);
				}).map(function(obj) {
					return obj.name + ' (' + obj.file + ')';
				});

				undocumentedNames = _.chain(undocumentedNames).compact().value();

				grunt.log.subhead('Undocumented direct members of classes: ' + undocumentedNames.length);
				grunt.verbose.writeln('That is, direct members of classes with no jsdoc annotations at all. _name, \'name\', "name" not included.');
				grunt.verbose.writeln('');

				undocumentedNames.sort().forEach(function(name) {
					grunt.verbose.writeln(name);
				});

				done();
			});

		}); //requirejs parse

	});


};
