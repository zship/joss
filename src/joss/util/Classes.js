/*
 * Static utility methods dealing with dojo "Classes"
 */
define(function(require) {

	var declare = require('dojo/_base/declare');
	var lang = require('dojo/_base/lang');
	var isFunction = require('amd-utils/lang/isFunction');
	var isArray = require('amd-utils/lang/isArray');
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

		_generateAccessors(constructor);
		_chainMethods(constructor);

		return constructor;

	};


	var _generateGenericAccessors = function(proto) {

		//non-es5 mode
		proto.get = function(name) {
			if (isFunction(this['get ' + name])) {
				return this['get ' + name]();
			}
			else if (name.search(/\./g) === -1) {
				return this['_' + name];
			}
			else {
				return lang.getObject('_' + name, false, this);
			}
		};

		proto.set = function(name, val) {
			var args = toArray(arguments);
			if (isFunction(this['set ' + name])) {
				this['set ' + name].apply(this, args.slice(1));
				return this;
			}
			else if (name.search(/\./g) === -1) {
				this['_' + name] = val;
				return this;
			}
			else {
				lang.setObject('_' + name, val, this);
				return this;
			}
		};

	};


	var _generateAccessors = function(constructor) {

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

		accessorNames.forEach(function(key) {
			//member by this name already exists.
			if (proto[key] !== undefined) {
				//if it's an empty function, it's being used for jsdoc.
				//allow overwriting it
				if (proto[key].toString() !== 'function (){}') {
					return true; //continue
				}
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

			proto[key] = function() {
				if (arguments.length === 0) {
					return this['get ' + key]();
				}
				var args = toArray(arguments);
				return this['set ' + key].apply(this, args);
			};
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

		forOwn(opts, function(val, key) {
			if (isFunction(obj[key])) {
				obj[key](val);
			}
			else if (obj['_' + key]) {
				obj['_' + key] = val;
			}
			else {
				obj[key] = val;
			}
		});
	};


	Classes.getsetAndApply = function(obj, opts) {
		Classes.getset(obj, objectKeys(opts));
		Classes.applyOptions(obj, opts);
	};


	return Classes;

});
