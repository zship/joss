/*
 * Static utility methods dealing with dojo "Classes"
 */
define(function(require) {

	var declare = require('dojo/_base/declare');
	var lang = require('dojo/_base/lang');
	var merge = require('amd-utils/object/merge');
	var isFunction = require('amd-utils/lang/isFunction');
	var isObject = require('amd-utils/lang/isObject');
	var toArray = require('amd-utils/lang/toArray');
	var forEach = require('amd-utils/collection/forEach');
	var forOwn = require('amd-utils/object/forOwn');
	var objectKeys = require('amd-utils/object/keys');
	var waterfall = require('deferreds/waterfall');


	/**
	 * @namespace
	 * @alias joss/util/Classes
	 */
	var Classes = {};
	var rGetter = /get\s(.*)/;
	var rSetter = /set\s(.*)/;


	Classes.create = function(superclass, definition) {

		if (arguments.length === 1) {
			definition = superclass;
			superclass = null;
		}

		var constructor = declare(superclass, definition);

		_generateGenericAccessors(constructor);
		_generateEs5Accessors(constructor);
		_chainMethods(constructor);

		return constructor;

	};


	//general-purpose getters/setters: sole purpose is to cache results of
	//string operations on object keys
	var _generateGenericAccessors = function(constructor) {
		var proto = constructor.prototype;
		var accessorNames = _findAccessorNames(constructor);

		//just to keep from doing string operations to determine private names
		var cache = {};

		var _addCache = function(name) {
			cache[name] = {
				privateName: '_' + name.replace(/\./g, '._'),
				topLevel: (name.search(/\./g) === -1)
			};
			return cache[name];
		};

		accessorNames.forEach(function(name) {
			_addCache(name);
		});

		//non-es5 mode
		proto.get = function(name) {
			cache[name] = cache[name] || _addCache(name);
			if (cache[name].topLevel) {
				return this[cache[name].privateName];
			}
			else {
				return lang.getObject(cache[name].privateName, false, this);
			}
		};

		proto.set = function(name, val) {
			cache[name] = cache[name] || _addCache(name);
			if (cache[name].topLevel) {
				this[cache[name].privateName] = val;
			}
			else {
				lang.setObject(cache[name].privateName, val, this);
			}
		};

	};


	var _findAccessorNames = function(constructor) {
		var proto = constructor.prototype;
		var bases = constructor._meta.bases;
		var accessorNames = proto['-accessors-'] || [];

		//collect accessors from superclasses
		bases.forEach(function(base) {
			if (base._meta && base._meta.accessors) {
				base._meta.accessors.forEach(function(name) {
					if (accessorNames.indexOf(name) === -1) {
						accessorNames.push(name);
					}
				});
			}
		});

		Object.keys(proto).forEach(function(key) {
			var matches = [];
			var name;

			if ((matches = key.match(rGetter)) !== null) {
				name = matches[1];
				if (accessorNames.indexOf(name) === -1) {
					accessorNames.push(name);
				}
			}
			else if ((matches = key.match(rSetter)) !== null) {
				name = matches[1];
				if (accessorNames.indexOf(name) === -1) {
					accessorNames.push(name);
				}
			}
		});

		constructor._meta.accessors = accessorNames;

		return accessorNames;
	};


	var _generateAccessors = function(constructor) {
		var proto = constructor.prototype;
		var accessorNames = _findAccessorNames(constructor);

		accessorNames.forEach(function(key) {
			//if it's an empty function, it's being used for jsdoc.
			//allow overwriting it
			if (proto[key] && proto[key].toString() === 'function () {}') {
				delete proto[key];
			}

			//member by this name already exists.
			if (proto[key] !== undefined) {
				return true; //continue
			}

			if (!proto['get ' + key]) {
				proto['get ' + key] = function() {
					return this['_' + key];
				};
			}

			if (!proto['set ' + key]) {
				proto['set ' + key] = function(val) {
					this['_' + key] = val;
					return this;
				};
			}

			proto[key] = function(val) {
				if (arguments.length === 0) {
					return this['get ' + key]();
				}
				this['set ' + key](val);
				return this;
			};
		});
	};


/*
 *    var _generateEs5Accessors = function(constructor) {
 *        var proto = constructor.prototype;
 *        var accessorNames = _findAccessorNames(constructor);
 *
 *        accessorNames.forEach(function(key) {
 *            //member by this name already exists.
 *            if (proto[key] !== undefined) {
 *                delete proto[key];
 *            }
 *
 *            if (!proto['get ' + key]) {
 *                proto['get ' + key] = function() {
 *                    return this['_' + key];
 *                };
 *            }
 *
 *            if (!proto['set ' + key]) {
 *                proto['set ' + key] = function(val) {
 *                    this['_' + key] = val;
 *                };
 *            }
 *
 *            Object.defineProperty(proto, key, {
 *                enumerable: true,
 *                get: proto['get ' + key],
 *                set: proto['set ' + key]
 *            });
 *        });
 *    };
 */


	//just a general-purpose tree data structure to make it clearer what
	//_buildAccessorTree is doing
	var TreeNode = function(data) {
		this.data = data;
		this._parent = null;
		this.children = [];
	};

	Object.defineProperty(TreeNode.prototype, 'parent', {
		get: function() {
			return this._parent;
		},
		set: function(val) {
			this._parent = val;
			val.children.push(this);
		}
	});

	TreeNode.prototype.hasChildren = function() {
		return (this.children.length > 0);
	};

	TreeNode.prototype.find = function(iterator) {
		var result;

		if (!this.children) {
			return undefined;
		}

		this.children.every(function(node) {
			if (iterator(node.data) === true) {
				result = node;
				return false; ///break;
			}
			else {
				return node.find(iterator);
			}
			return true;
		});

		return result;
	};


	//tree of generated accessor *names* (nothing fancier). used in
	//_generateEs5Accessors for traversal through nested accessor methods.
	var _buildAccessorTree = function(accessorNames) {
		var root = new TreeNode();

		accessorNames.forEach(function(name) {
			var parts = name.split(".");
			var context = root;
			var path = '';

			parts.every(function(part) {
				path = path ? (path + '.' + part) : part;

				if (!context) {
					return false; //break;
				}

				var exists = false;
				context.children.every(function(node) {
					if (node.data.name === part) {
						exists = true;
						context = node;
						return false; //break
					}
					return true;
				});

				if (!exists) {
					var node = new TreeNode({name: part, fullName: path});
					node.parent = context;
					context = node;
				}

				return true;
			});
		});

		return root;
	};


	var _generateEs5Accessors = function(constructor) {

		var proto = constructor.prototype;
		var accessorNames = _findAccessorNames(constructor);

		accessorNames.forEach(function(key) {
			//member by this name already exists.
			if (proto[key] !== undefined) {
				delete proto[key];
			}

			if (!proto['get ' + key]) {
				proto['get ' + key] = function() {
					return this.get(key);
				};
			}

			if (!proto['set ' + key]) {
				proto['set ' + key] = function(val) {
					this.set(key, val);
				};
			}
		});

		var _deepMap = function(obj, iterator) {
			var result = lang.clone(obj);
			var keys = Object.keys(obj);

			for(var i = 1, l = keys.length; i < l; i++) {
				var key = keys[i];
				var val = obj[key];

				iterator(val, key, result);

				if (isObject(val)) {
					_deepMap(val, iterator);
				}
			}

			return result;
		};

		//change all _prefixed keys to unprefixed ones, for mixing in
		var _privateToPublic = function(obj) {
			return _deepMap(obj, function(val, key, result) {
				var isPrivate = key.search(/^_/) !== -1;
				var publicName = key.replace(/^_/, '');
				if (isPrivate) {
					result[publicName] = val;
				}
			});
		};

		var root = _buildAccessorTree(accessorNames);

		var _defineAccessor = function(node, context, instance) {
			Object.defineProperty(context, node.data.name, {
				get: function() {
					if (context === proto) {
						instance = this;
					}
					return instance['get ' + node.data.fullName].call(instance);
				},
				set: function(val) {
					if (context === proto) {
						instance = this;
					}

					var prevVal;
					if (node.hasChildren()) {
						prevVal = instance.get.call(instance, node.data.fullName) || {};
						//passed values for deep objects could be partial.
						//mix-in to previous value, giving passed _prefixed
						//values a chance too (in case we're passed an object
						//already generated by Classes._generateAccessors, for
						//example in copy constructors)
						val = merge(
							_privateToPublic(prevVal),
							_privateToPublic(val),
							val
						);
					}

					instance['set ' + node.data.fullName].call(instance, val);

					if (node.hasChildren()) {
						node.children.forEach(function(child) {
							var next = val[child.data.name];
							if (next === undefined) {
								next = val['_' + child.data.name];
							}

							if (next === undefined) {
								return true;
							}

							//pass previous value in the rare case it's needed, as it was just
							//overwritten by the parent setter above
							var prev = prevVal[child.data.name];
							if (prev === undefined) {
								prev = prevVal['_' + child.data.name];
							}

							instance['set ' + child.data.fullName].call(instance, next, prev);

							//redefine child accessors every time parent is changed
							_defineAccessor(child, val, this);
						}.bind(this));
					}
				}
			});
		};

		root.children.forEach(function(node) {
			_defineAccessor(node, proto, undefined);
		});

	};


	//perform special chaining which can wait for Deferred objects in the chain
	//to complete
	var _chainMethods = function(constructor) {

		var proto = constructor.prototype;
		var chains = constructor._meta.chains;
		var bases = constructor._meta.bases;

		forEach(chains, function(val, key) {
			if (val !== 'deferredAfter' && val !== 'deferredBefore') {
				return true; //continue
			}

			var i = 0;
			var step = 1;
			var methodList = [];

			if (val === 'deferredAfter'){
				i = bases.length - 1;
				step = -1;
			}

			for (; !!bases[i]; i+=step) {
				var base = bases[i];
				var method = (base._meta ? base._meta.hidden : base.prototype)[key];
				if (method) {
					methodList.push(method);
				}
			}

			proto[key] = function() {
				var args = Array.prototype.slice.apply(arguments);

				var list = methodList.map(function(method) {
					return method.bind(this);
				}.bind(this));

				if (args.length) {
					list.unshift(args);
				}

				return waterfall(list);
			};

			proto[key].nom = key;
		});

	};


	/**
	 * Calls setter methods on **obj** of the same name as each **opts** property.
	 * Optionally mixin **opts** into **defaults** before calling setters.
	 *
	 * @param {Object} obj
	 * @param {Object} defaults
	 * @param {Object} opts
	 */
	Classes.applyOptions = function(obj, defaults, opts) {
		if (arguments.length === 3) {
			opts = lang.mixin(defaults, opts);
		}
		else if (arguments.length === 2) {
			opts = defaults;
		}

		var proto = Object.getPrototypeOf(obj);

		forOwn(opts, function(val, key) {
			var prop = Object.getOwnPropertyDescriptor(proto, key);

			if (prop && prop.get && prop.set) {
				obj[key] = val;
				return true; //continue
			}
		});
	};


	Classes.getsetAndApply = function(obj, opts) {
		Classes.getset(obj, objectKeys(opts));
		Classes.applyOptions(obj, opts);
	};


	return Classes;

});
