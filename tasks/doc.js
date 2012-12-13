module.exports = function(grunt) {
	'use strict';

	var docdir = 'doc';
	var libdir = 'doc/lib';

	var fs = require('fs');
	var path = require('path');
	var child = require("child_process");
	var _ = grunt.utils._;

	var taffy = require("../doc/lib/taffy.js").taffy;
	var jade = require('jade');
	var md = require('marked');
	var hljs = require('highlight.js');
	//var async = require('async');
	var util = require('./util.js');

	var requirejs = require('../dist/lib/r.js');
	var rjsconfig = require('./rjsconfig.js');


	//track names which *should* be documented (assigned in _processJsdoc) and
	//compare against what was actually documented (_checkMissingDocumentation)
	var documentedNames = {};
	var undocumentedNames = [];
	var undeclaredTypes = [];



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


	function getType(name, debugContext) {
		if (!name) {
			return typeMap['void'];
		}

		//first try the fast dictionary approach for perfect String matches
		if (typeMap[name]) {
			return typeMap[name];
		}

		//next try generics (e.g. Array<String>)
		var matches;
		if ((matches = name.match(/(.*?)<(.*)>/))) {
			var container = matches[1];
			var containerType = getType(container, debugContext);

			if (!containerType) {
				return;
			}

			var argString = matches[2];

			var args = [];
			argString.split(',').forEach(function(arg, i) {
				var type = getType(arg.trim(), debugContext + ' (type parameter #' + i + ' to ' + name + ')');
				args.push(type || defaultType(arg.trim()));
			});

			return {
				generic: true,
				name: containerType.name,
				longName: containerType.longName,
				link: containerType.link,
				args: args
			};
		}

		//next try short-names
		var shortNames = _.filter(typeMap, function(type) {
			return (name === type.name);
		});

		if (shortNames.length === 1) {
			return shortNames[0];
		}
		else if (shortNames.length > 1){
			grunt.log.subhead('WARNING: Ambiguous usage of short-name ' + name + '. Documentation will not present a link.');
		}

		var foundMatch;

		//next try types specified as RegExp objects, matching
		//against the provided name
		_.every(typeMap, function(type) {
			if (!type.regexp) {
				return true;
			}

			if (name.search(type.regexp) !== -1) {
				foundMatch = {
					name: name.replace(type.regexp, '$1'),
					longName: name,
					link: name.replace(type.regexp, type.link)
				};
				return false;
			}

			return true;
		});

		if (foundMatch) {
			return foundMatch;
		}

		undeclaredTypes.push({
			name: name,
			context: debugContext
		});

		//a class, not a method/member
		/*
		 *if (name.search(/[#~\.]/g) === -1 && !missingNames[name]) {
		 *    missingNames[name] = true;
		 *    grunt.log.subhead('WARNING: The type ' + name + ' was not declared anywhere in the project. Documentation will not present a link.');
		 *}
		 */

	}


	function defaultType(name) {
		return {
			name: name,
			longName: name,
			link: ''
		};
	}


/*
 *    function getTypes(names, create) {
 *        if (!_.isArray(names)) {
 *            names = [names];
 *        }
 *
 *        var types = [];
 *        names.forEach(function(name) {
 *            types.push(getType(name, create));
 *        });
 *
 *        return types;
 *    }
 */

	function _moduleFullName(declaredName, filePath) {
		var srcDirectory = path.resolve(process.cwd() + '/' + rjsconfig.baseUrl);
		var moduleDirectory = path.resolve(process.cwd() + '/' + _.initial(filePath.split('/')).join('/'));

		declaredName = declaredName.replace(/\.js/, '');
		var absolutePath;

		//directory-relative path
		if (declaredName.search(/^\.\.\//g) !== -1 || declaredName.search(/^\.\//) !== -1) {
			absolutePath = path.resolve(moduleDirectory + '/' + declaredName + '.js');
			return absolutePath.replace(srcDirectory + '/', '').replace('.js', '');
		}

		absolutePath = path.resolve(srcDirectory + '/' + declaredName + '.js');
		return absolutePath.replace(srcDirectory + '/', '').replace('.js', '');
	}


	function _fileToModuleName(filePath) {
		var srcDirectory = path.resolve(process.cwd() + '/' + rjsconfig.baseUrl);
		var absolutePath = path.resolve(process.cwd() + '/' + filePath);

		filePath = filePath.replace(/\.js/, '');

		return absolutePath.replace(srcDirectory + '/', '').replace('.js', '');
	}


	var processJsDoc = function(json, deps) {

		var db = taffy(json);


		//we're handling (multiple) inheritance ourselves. besides, jsdoc has a
		//weird behavior of assigning the filename and path from the superclass
		//to the subclass, and I'd like to be able to identify methods by filename
		db({inherited: true}).remove();


		var cache = {};
		//derive module names from the file name
		db().each(function(record) {
			if (record && record.meta && record.meta.path) {
				var fileName = record.meta.path + '/' + record.meta.filename;
				cache[fileName] = cache[fileName] || _fileToModuleName(fileName);
				record.module = cache[fileName];
			}
		});

		cache = {};


		db({kind: ['class', 'namespace']}).each(function(record) {
			//AMD convention: class names and namespace names are the same as
			//their module name
			var clazz = record;
			var moduleName = record.module;

			//update all members of this class to point to the new class name
			db(function() {
				return !!(
					this.memberof === clazz.longname &&
					this.meta &&
					this.meta.path === clazz.meta.path &&
					this.meta.filename === clazz.meta.filename
				);
			}).each(function(record) {
				record.longname = record.longname.replace(record.memberof, moduleName);
				record.memberof = moduleName;
			});

			clazz.longname = moduleName;
			//convention: class short names are the last part of their module's name (e.g. 'joss/geometry/Point' -> 'Point')
			clazz.name = moduleName.match(/.*\/(.*)$/).pop();
			//console.log(JSON.stringify(clazz, false, 4));
		});


		db({kind: ['class', 'namespace']}).each(function(record) {
			var clazz = record;
			var className = clazz.longname;

			//AMD convention: see if there's a sibling directory of the
			//same name as the class which contains implementations (and
			//documentation)
			var implPath = clazz.meta.path + '/' + clazz.name.toLowerCase();
			var resolvedImplPath = path.resolve(process.cwd() + '/' + implPath);
			var hasImplDirectory = fs.existsSync(resolvedImplPath);
			//console.log(implPath, hasImplDirectory);

			//var stopwatch = new Stopwatch().start();
			//var count = 0;
			db(function() {
				return (
					this.undocumented &&
					this.memberof === className &&
					this.meta &&
					this.meta.path === clazz.meta.path &&
					this.meta.filename === clazz.meta.filename
				);
			}).each(function(record) {
				var impl;
				//count++;
				//find a file with documentation under implPath with the same
				//name as the undocumented member
				if (hasImplDirectory && (impl = db(function() {
					return (
						this.name === record.name &&
						this.meta &&
						this.meta.path === implPath &&
						this.meta.filename === record.name + '.js' &&
						!this.undocumented
					);
				//if one exists, apply its documentation to the undocumented member
				}).first())) {
					record.kind = impl.kind;
					record.type = impl.type;
					record.params = impl.params;
					record.returns = impl.returns;
					record.description = impl.description;
					//record.meta = impl.meta;
					record.imported = {
						module: impl.module,
						path: impl.meta.path,
						filename: impl.meta.filename,
						lineno: impl.meta.lineno
					};
					record.undocumented = false;
				}
				//else, flag this as an undocumented class member (for summary info)
				else {
					undocumentedNames.push({
						name: record.longname,
						file: record.meta.path + '/' + record.meta.filename + ':' + record.meta.lineno
					});
				}
			});
			//console.log('processJsdoc: ' + className + ' ' + count + ' ' + stopwatch.elapsed() + 'ms');
		});


		//subsequent processing can be sped up by removing undocumented
		//variables (which outnumber documented ones, since every single
		//variable in any scope is counted by jsdoc)
		db({undocumented: true}).remove();


		//reassign 'anonymous'-scoped variables to their module's scope
/*
 *        db({longname: {'like': '<anonymous>'}}).each(function(record) {
 *            if (record.module) {
 *                //convention: 'anonymous' variables under the same name as the
 *                //module/class's short name are static members of that class
 *                var moduleShortName = record.module.match(/.*\/(.*)$/).pop();
 *                if (record.longname.search(new RegExp('<anonymous>~' + moduleShortName)) !== -1) {
 *                    record.longname = record.longname.replace('<anonymous>~' + moduleShortName, record.module);
 *                    return; //continue
 *                }
 *
 *                record.longname = record.longname.replace('<anonymous>', record.module);
 *                record.name = record.longname.match(/.*~(.*)$/).pop();
 *            }
 *        });
 */


		//collect a map of longnames to short aliases for classes, to be used
		//when printing parameters and return types
		db({kind: ['class', 'namespace']}).each(function(record) {
			var className = record.name;
			var classLongName = record.longname;
			typeMap[classLongName] = {
				userDefined: true,
				longName: classLongName,
				name: className,
				link: '/#/' + classLongName
			};
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
			var fileName = record.meta.path + '/' + record.meta.filename;

			//see if items in the dependency array are in the type map (for linking
			//in final documentation)
			deps[module].forEach(function(dep) {
				var type = getType(dep.fullName, fileName + ' requirejs dependency');
				if (type && type.link) {
					dep.link = type.link;
				}
			});


			record.description = record.description || '';

			graph[module] = {};
			graph[module]['meta'] = {
				deps: deps[module]
			};
			graph[module]['constructor'] = {};
			graph[module]['properties'] = {};
			graph[module]['methods'] = {};
			graph[module]['jquery'] = {};


			if (record.kind === 'class') {
				var constructor = graph[module]['constructor'] = record;
				constructor.longName = constructor.longname;
				constructor.link = getType(constructor.longName).link;
				constructor.description = constructor.description || '';

				constructor.params = constructor.params || [];
				constructor.params.forEach(function(param) {
					if (!param.type || !param.type.names) {
						param.type = getType(null);
						return true;
					}

					param.types = [];
					param.type.names.forEach(function(name, i) {
						var type = getType(name, constructor.longName + ' constructor parameter #' + i);
						if (!type) {
							type = defaultType(name);
						}
						param.types.push(type);
					});
				});
			}


			db({kind: 'member'}, {module: module}).each(function(record) {
				var member = graph[module]['properties'][record.name] = record;
				member.longName = member.longname;
				member.link = '/#/' + member.longName;

				if (!member.type || !member.type.names) {
					member.types = [getType(null)];
				}
				else {
					member.types = [];
					member.type.names.forEach(function(name) {
						var type = getType(name, member.longName + ' type');
						if (!type) {
							type = defaultType(name);
						}
						member.types.push(type);
					});
				}

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
				method.link = '/#/' + method.longName;
				method.description = method.description || '';

				method.params = method.params || [];
				method.params.forEach(function(param) {
					if (!param.type || !param.type.names) {
						param.types = [getType(null)];
						return true;
					}

					param.types = [];
					param.type.names.forEach(function(name, i) {
						var type = getType(name, method.longName + ' parameter #' + i);
						if (!type) {
							type = defaultType(name);
						}
						param.types.push(type);
					});
				});

				if (method.returns) {
					method.returns.types = [];
					method.returns[0].type.names.forEach(function(name, i) {
						var type = getType(name, method.longName + ' return type #' + i);
						if (!type) {
							type = defaultType(name);
						}
						method.returns.types.push(type);
					});
				}
				else {
					method.returns = {types: [getType(null)]};
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
			grunt.verbose.write('\t');
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
			//console.log(moduleName);
			//console.log('----');
			//console.log(mixinParts);

			//first description in the file is the module description, if no
			//"%[memberName]" declaration exists before it
			if (mixinParts.length && mixinParts[0].trim() && mixinParts[0].search(/^##\s*\S*$/) === -1) {
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

		var sNamePath = '{(\\S*?)([#~\\.])(\\S*?)}';
		var rNamePath = new RegExp(sNamePath);
		var rNamePathGlobal = new RegExp(sNamePath, 'g');

		var sClassName = '{([^{]\\S*?)}';
		var rClassName = new RegExp(sClassName);
		var rClassNameGlobal = new RegExp(sClassName, 'g');

		//console.log(descriptions);

		_getDescriptions(graph).forEach(function(obj) {

			var description = obj.description;
			var matches;
			
			//first, class name + member name
			
			//global matching will disregard capturing groups, so
			//capture the full matches and then iterate over all of
			//them, matching again.
			matches = description.match(rNamePathGlobal) || [];
			matches.forEach(function(match) {
				var submatches = match.match(rNamePath);

				var name = submatches[0];
				var typeName = submatches[1];
				var scope = submatches[2];
				var propName = submatches[3];

				var rName = new RegExp(name, 'g');

				var type = getType(typeName, 'inside ' + obj.longName + ' description') || defaultType(typeName);

				var longName = type.longName + scope + propName;
				var shortName = type.name + '.' + propName;

				if (type.link) {
					description = description.replace(rName, '<a href="/#/' + longName + '" title="' + longName + '">' + shortName + '</a>');
				}
				else {
					description = description.replace(rName, shortName);
				}
			});

			//then, just plain class names (no member name following)
			matches = description.match(rClassNameGlobal) || [];
			matches.forEach(function(match) {
				var submatches = match.match(rClassName);

				var typeName = submatches[1];
				var type = getType(typeName, 'inside ' + obj.longName + ' description') || defaultType(typeName);
				var title = type.longName;
				if (type.longName === type.name) {
					title = '';
				}

				var rName = new RegExp('{' + typeName + '}', 'g');

				if (type.link) {
					description = description.replace(rName, '<a href="' + type.link + '" title="' + title + '">' + type.name + '</a>');
				}
				else {
					description = description.replace(rName, typeName);
				}
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

			//add inheritance info into `graph` for use in final doc templates
			if (clazz.constructor && clazz.constructor.augments) {
				clazz.extends = [];
				clazz.constructor.augments.forEach(function(name) {
					clazz.extends.push(getType(name, 'inheritance info - superclass of ' + className) || defaultType(name));
				});
			}

			if (obj.bases.length) {
				clazz.heirarchy = [];
				obj.bases.forEach(function(name) {
					clazz.heirarchy.push(getType(name, 'inheritance info - in heirarchy of ' + className) || defaultType(name));
				});
			}

			//order from highest ancestor -> self
			obj.bases = obj.bases.reverse();
			//last entry is the class itself. remove.
			obj.bases.pop();

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
								name: getType(superclassName).name,
								longName: prop.longName,
								link: '/#/' + prop.longName
							};
							clazz[type][key].link = prop.link.replace(superclassName, className);
							clazz[type][key].longName = prop.longName.replace(superclassName, className);
						}
						//overridden
						else {
							clazz[type][key].overridden = {
								name: getType(superclassName).name,
								longName: prop.longName,
								link: '/#/' + prop.longName
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
		var jadeOpts = {filename: docdir + '/tpl/class.jade'};
		if (!classTpl) {
			grunt.verbose.write('\t\t');
			classTpl = grunt.file.read(jadeOpts.filename, 'utf-8');
		}
		var data = jade.compile(classTpl, jadeOpts)({cl: graph, module: path, config: config});
		callback(graph, path, data);
	};

	var tagListTpl;

	var renderTagList = function(graph, path, callback) {
		var jadeOpts = {filename: docdir + '/tpl/taglist.jade'};
		if (!tagListTpl) {
			grunt.verbose.write('\t\t');
			tagListTpl = grunt.file.read(jadeOpts.filename, 'utf-8');
		}
		var data = jade.compile(tagListTpl, jadeOpts)({cl: graph, module: path});
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
				var type = getType(child, 'rendering menu') || defaultType(child);
				html += '<li>';
				html += '<a href="' + type.link + '">' + key + '</a>';
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


	var printSummary = function(graph) {
		var typeNames = [];
		_.each(typeMap, function(obj) {
			typeNames.push(obj.name);
		});

		var typeConflicts = _.difference(typeNames, _.uniq(typeNames));

		grunt.log.subhead('Declared types');
		grunt.log.writeln('===========================================================');
		grunt.log.writeln('Use --verbose for more information');

		grunt.log.writeln('');
		grunt.log.writeln('Ambiguous short-names: ' + typeConflicts.length);
		grunt.verbose.writeln('-----------------------------------------------------------');
		if (typeConflicts.length) {
			grunt.verbose.writeln('Long-names must be used in jsdoc annotations and inline "{}" references for these types:');
			typeConflicts.forEach(function(name) {
				var types = _.filter(typeMap, function(obj) {
					return obj.name === name;
				});
				grunt.verbose.write(name + ' could refer to: ');
				types.forEach(function(obj) {
					grunt.verbose.write(obj.longName + ' ');
				});
				grunt.verbose.write('\n');
			});
		}
		else {
			grunt.verbose.writeln('(None)');
		}
		/*
		 *else {
		 *    grunt.log.writeln('Congratulations! You can use short names ("Rect" vs "joss/geometry/Rect") in your jsdoc annotations and inline "{}" references!');
		 *}
		 */

		grunt.verbose.writeln('');
		grunt.log.writeln('Never-declared (but used) types: ' + undeclaredTypes.length);
		grunt.verbose.writeln('-----------------------------------------------------------');
		if (undeclaredTypes.length) {
			undeclaredTypes.forEach(function(type) {
				grunt.verbose.writeln(type.name + ' (Location: ' + type.context + ')');
			});
		}
		else {
			grunt.verbose.writeln('(None)');
		}

		grunt.verbose.writeln('');
		grunt.verbose.writeln('All declared types:');
		grunt.verbose.writeln('-----------------------------------------------------------');
		var typeLongNames = _.compact(_.pluck(typeMap, 'longName'));
		var maxLength = _.max(typeLongNames, function(name) {
			return name.length;
		}).length + 1;
		grunt.verbose.writeln(grunt.log.table([maxLength, 2, 40], ['Long Name', '|', 'Short Name']));
		grunt.verbose.writeln('-----------------------------------------------------------');
		typeLongNames.sort().forEach(function(name) {
			grunt.verbose.writeln(grunt.log.table([maxLength, 2, 40], [name, '|', typeMap[name].name]));
			//grunt.verbose.writeln(name + ' - ' + typeMap[name].name);
		});


		grunt.log.subhead('Documentation Coverage');
		grunt.log.writeln('===========================================================');
		grunt.log.writeln('Use --verbose to see the names of all undocumented variables');
		grunt.log.writeln('');

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
		grunt.verbose.writeln('');
		grunt.log.writeln('Markdown description coverage: ' + markdownDocumentedNames.length + ' of ' + docTotal.length + ' (' + ((markdownDocumentedNames.length / docTotal.length) * 100).toFixed(1) + '%)');
		grunt.verbose.writeln('-----------------------------------------------------------');
		grunt.verbose.writeln('The following variables have no markdown documentation:');
		grunt.verbose.writeln('');
		if (mdownMissing.length) {
			mdownMissing.sort().forEach(function(name) {
				grunt.verbose.writeln(name + ' (' + docFileMap[name] + ')');
			});
		}
		else {
			grunt.verbose.writeln('(None)');
		}

		var docPresent = _getDescriptions(graph).map(function(obj) {
			if (obj.description && obj.description.trim() && !obj.inherited) {
				return obj.longName;
			}
			return '';
		});

		docPresent = _.chain(docPresent).compact().uniq().value();

		var docMissing = _.difference(docTotal, docPresent);
		grunt.verbose.writeln('');
		grunt.log.writeln('All description coverage: ' + docPresent.length + ' of ' + docTotal.length + ' (' + ((docPresent.length / docTotal.length) * 100).toFixed(1) + '%)');
		grunt.verbose.writeln('-----------------------------------------------------------');
		grunt.verbose.writeln('The following variables have no descriptions (inherited or otherwise):');
		grunt.verbose.writeln('');
		if (docMissing.length) {
			docMissing.sort().forEach(function(name) {
				grunt.verbose.writeln(name + ' (' + docFileMap[name] + ')');
			});
		}
		else {
			grunt.verbose.writeln('(None)');
		}

		undocumentedNames = undocumentedNames.filter(function(obj) {
			//remove private-ish names and proven-documented names (jsdoc will count all usages of a property as separate undocumented cases)
			return (obj.name.search(/.*[#.][_'"]/) === -1)
				&& (!documentedNames[obj.name])
				&& (obj.name.search(/~/g) === -1);
		}).map(function(obj) {
			return obj.name + ' (' + obj.file + ')';
		});

		undocumentedNames = _.chain(undocumentedNames).compact().value();

		grunt.verbose.writeln('');
		grunt.log.writeln('Direct members of classes with no jsdoc annotations: ' + undocumentedNames.length);
		grunt.verbose.writeln('-----------------------------------------------------------');
		grunt.verbose.writeln('_name, \'name\', "name" not included.');
		grunt.verbose.writeln('');
		if (undocumentedNames.length) {
			undocumentedNames.sort().forEach(function(name) {
				grunt.verbose.writeln(name);
			});
		}
		else {
			grunt.verbose.writeln('(None)');
		}
	};


	//just a helper for logging elapsed time below, for brevity's sake
	var Stopwatch = function() {
		this._startTime = (new Date()).getTime();
		this._stopTime = (new Date()).getTime();
		this._running = false;
	};

	Stopwatch.prototype.start = function() {
		this._startTime = (new Date()).getTime();
		this._running = true;
		return this;
	};

	Stopwatch.prototype.stop = function() {
		this._stopTime = (new Date()).getTime();
		this._running = false;
		return this;
	};

	Stopwatch.prototype.reset = function() {
		this._startTime = (new Date()).getTime();
		this._stopTime = (new Date()).getTime();
		return this;
	};

	Stopwatch.prototype.elapsed = function() {
		if (!this._running) {
			return this._stopTime - this._startTime;
		}
		var curTime = (new Date()).getTime();
		return (curTime - this._startTime);
	};



	//idea: put a search box above class list that filters the class list
	grunt.registerTask('doc', 'Runs jsdoc', function() {
		var totalStopwatch = new Stopwatch().start();
		var config = grunt.config.get(this.name);
		var done = this.async();

		['include', 'exclude'].forEach(function(name) {
			config[name] = util.expand(config[name]);
		});

		config.include = _.difference(config.include, config.exclude);

		populateTypeMap(config.types || []);

		requirejs(['../dist/lib/parse'], function(parse) {

			var files = config.include;
			var stopwatch = new Stopwatch().start();

			grunt.log.subhead('Generating documentation for ' + files.length + ' files');
			grunt.log.writeln('===========================================================');


			grunt.log.writeln('Tracing AMD dependencies...');
			var deps = {};
			files.forEach(function(filePath) {
				var moduleName = _fileToModuleName(filePath);

				grunt.verbose.write('\t');
				var contents = grunt.file.read(filePath);

				try {
					deps[moduleName] = parse.findDependencies(filePath, contents);
				}
				catch(e) {
					deps[moduleName] = [];
				}

				//resolve requirejs dependencies relative to src path
				//(as opposed to relative to the file in which they're require'd)
				deps[moduleName] = deps[moduleName].map(function(depName) {
					return {
						fullName: _moduleFullName(depName, filePath),
						link: ''
					};
				});
			});
			grunt.log.ok(stopwatch.elapsed() + 'ms');
			stopwatch.reset();


			var runJsdoc = function(callback) {
				var jsdocCache = docdir + '/out.json';
				//skip jsdoc parsing and use a cached file
				if (config.useJsdocCache && fs.existsSync(jsdocCache)) {
					grunt.log.writeln('');
					grunt.log.writeln('Using jsdoc cache at ' + path.resolve(process.cwd() + '/' + jsdocCache + '...'));
					var json = grunt.file.read(jsdocCache);
					callback(json);
					return;
				}

				grunt.log.writeln('');
				grunt.log.writeln('Running jsdoc...');
				var command = libdir + '/jsdoc/jsdoc -X ' + files.join(' ');
				grunt.verbose.writeln('> ' + command);

				child.exec(command, {maxBuffer: 2000000}, function(error, json) {
					grunt.file.write(jsdocCache, json, 'utf-8');
					callback(json);
				});
			};


			runJsdoc(function(json) {

				grunt.log.ok(stopwatch.elapsed() + 'ms');
				stopwatch.reset();

				grunt.log.writeln('');
				grunt.log.writeln('Massaging jsdoc output...');

				//strip out error-causing lines
				json = json.replace(/<Object>/gm, "\"Object\"");
				json = json.replace(/:\sundefined/gm, ": \"undef\"");
				var graph = JSON.parse(json);

				//console.log(JSON.stringify(graph, false, 4));

				graph = processJsDoc(graph, deps);
				grunt.log.ok(stopwatch.elapsed() + 'ms');
				stopwatch.reset();

				//console.log(JSON.stringify(graph, false, 4));

				grunt.log.writeln('');
				grunt.log.writeln('Mixing in markdown documentation...');
				mixinMarkdown(graph);
				grunt.log.ok(stopwatch.elapsed() + 'ms');
				stopwatch.reset();

				//console.log(JSON.stringify(graph, false, 4));

				grunt.log.writeln('');
				grunt.log.writeln('Transforming references to defined methods in descriptions into links...');
				transformLongNames(graph);
				grunt.log.ok(stopwatch.elapsed() + 'ms');
				stopwatch.reset();

				grunt.log.writeln('');
				grunt.log.writeln('Parsing and rendering markdown in descriptions...');
				parseMarkdown(graph);
				grunt.log.ok(stopwatch.elapsed() + 'ms');
				stopwatch.reset();

				grunt.log.writeln('');
				grunt.log.writeln('Mixing inherited methods into class definitions...');
				mixinInherited(graph);
				grunt.log.ok(stopwatch.elapsed() + 'ms');
				stopwatch.reset();

				grunt.log.writeln('');
				grunt.log.writeln('Rendering module definition files into ' + docdir + '/out/classes...');
				_.each(graph, function(val, key) {
					if (!key) {
						return true; //continue
					}

					var jadeStopwatch = new Stopwatch().start();

					//var path = key.replace(/\./g, '/');
					grunt.verbose.write('\t');
					grunt.verbose.writeln('Rendering class definition file ' + key + '...');
					//console.log(path);
					//console.log(val);
					renderModule(val, key, config, function(graph, path, data) {
						var filePath = docdir + '/out/classes/' + path + '.html';
						grunt.verbose.write('\t\t');
						grunt.file.write(filePath, data, 'utf-8');
					});

					grunt.verbose.write('\t');
					grunt.verbose.ok(jadeStopwatch.elapsed() + 'ms');
				});
				grunt.log.ok(stopwatch.elapsed() + 'ms');
				stopwatch.reset();


				grunt.log.writeln('');
				grunt.log.writeln('Rendering taglist files into ' + docdir + '/out/taglists...');
				_.each(graph, function(val, key) {
					if (!key) {
						return true; //continue
					}

					var jadeStopwatch = new Stopwatch().start();

					//var path = key.replace(/\./g, '/');
					grunt.verbose.write('\t');
					grunt.verbose.writeln('Rendering taglist file ' + key + '...');
					//console.log(path);
					//console.log(val);
					renderTagList(val, key, function(graph, path, data) {
						var filePath = docdir + '/out/taglists/' + path + '.html';
						grunt.verbose.write('\t\t');
						grunt.file.write(filePath, data, 'utf-8');
					});
					grunt.verbose.write('\t');
					grunt.verbose.ok(jadeStopwatch.elapsed() + 'ms');
				});
				grunt.log.ok(stopwatch.elapsed() + 'ms');
				stopwatch.reset();


				grunt.log.writeln('');
				grunt.log.writeln('Rendering menu...');
				var classList = _.clone(Object.keys(graph));
				var classStructure = {};
				_.each(classList, function(className) {
					var path = className.replace(/\//g,'.');
					setObject(path, className, classStructure);
				});
				grunt.log.ok(stopwatch.elapsed() + 'ms');
				stopwatch.reset();


				grunt.log.writeln('');
				grunt.log.writeln('Rendering module list into ' + docdir + '/out/menu.html...');
				var menu = renderMenu(classStructure, '');
				grunt.verbose.write('\t');
				grunt.file.write(docdir + '/out/menu.html', menu, 'utf-8');
				grunt.log.ok(stopwatch.elapsed() + 'ms');
				stopwatch.reset();

				printSummary(graph);

				grunt.log.writeln('');
				grunt.log.writeln('Total Time: ' + totalStopwatch.elapsed() + 'ms');

				done();
			});

		}); //requirejs parse

	});


};
