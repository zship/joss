/*
 * Static utility methods dealing with dojo "Classes"
 */
define(function(require) {

	var declare = require('dojo/_base/declare');
	var isFunction = require('amd-utils/lang/isFunction');
	var toArray = require('amd-utils/lang/toArray');
	var every = require('amd-utils/array/every');
	var forOwn = require('amd-utils/object/forOwn');
	var objectKeys = require('amd-utils/object/keys');


	/**
	 * @namespace
	 * @alias joss.util.Classes
	 */
	var Classes = {};


	/**
	 * Generates getter and setter methods according to the chainable "overloaded
	 * getter/setter" convention. Member variables should follow the convention
	 * of having a leading underscore, e.g. (property) "prop" -> "_prop".
	 *
	 * @param {Object} proto The prototype of the Object to extend
	 * @param {Array|Object|...String} names Names of the combined getter/setter methods to generate
	 */
	Classes.getset = function(getsetNames, superclass, props) {

		every(getsetNames, function(key) {
			//member by this name already exists.
			if (props[key] !== undefined) {
				return true; //continue
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

			props[key] = function(val) {
				if (val === undefined) {
					return this['_get' + keyUpper]();
				}
				var args = toArray(arguments);
				return this['_set' + keyUpper].apply(this, args);
			};

			return true;
		});

		return declare(superclass, props);

	};


	Classes.applyOptions = function(obj, opts) {
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
