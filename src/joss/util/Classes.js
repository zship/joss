/*
 * Static utility methods dealing with dojo "Classes"
 */
define(function(require) {

	var declare = require('dojo/_base/declare');
	var lang = require('dojo/_base/lang');
	var isFunction = require('amd-utils/lang/isFunction');
	var isArray = require('amd-utils/lang/isArray');
	var toArray = require('amd-utils/lang/toArray');
	var every = require('amd-utils/array/every');
	var forOwn = require('amd-utils/object/forOwn');
	var objectKeys = require('amd-utils/object/keys');


	/**
	 * @namespace
	 * @alias joss/util/Classes
	 */
	var Classes = {};


	/**
	 * Generates getter and setter methods according to the chainable
	 * "overloaded getter/setter" convention. "Private" member variables should
	 * follow the convention of having a leading underscore, e.g. (property)
	 * "prop" -> "_prop".
	 *
	 * @param {Object} proto The prototype of the Object to extend
	 * @param {Array|Object|...String} names Names of the combined getter/setter methods to generate
	 * @return {Object} 
	 */
	Classes.getset = function(getsetNames, superclass, props) {

		if (!isArray(getsetNames)) {
			getsetNames = objectKeys(getsetNames);
		}

		every(getsetNames, function(key) {
			//member by this name already exists.
			if (props[key] !== undefined) {
				//if it's an empty function, it's being used for jsdoc.
				//allow overwriting it
				if (props[key].toString() !== 'function (){}') {
					return true; //continue
				}
			}

			var keyUpper = key.charAt(0).toUpperCase() + key.slice(1);

			if (!props['_get' + keyUpper]) {
				props['_get' + keyUpper] = function() {
					return this['_' + key];
				};
			}

			if (!props['_set' + keyUpper]) {
				props['_set' + keyUpper] = function(val) {
					this['_' + key] = val;
					return this;
				};
			}

			props[key] = function() {
				if (arguments.length === 0) {
					return this['_get' + keyUpper]();
				}
				var args = toArray(arguments);
				return this['_set' + keyUpper].apply(this, args);
			};

			return true;
		});

		return declare(superclass, props);

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
		});
	};


	Classes.getsetAndApply = function(obj, opts) {
		Classes.getset(obj, objectKeys(opts));
		Classes.applyOptions(obj, opts);
	};


	return Classes;

});
