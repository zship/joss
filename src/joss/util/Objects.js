/*
 * Static utility methods dealing with Objects
 */
define(function() {

	var Objects = {};


	Objects.keys = Object.keys || function(obj) {
		var keys = [];
		for (var key in obj) {
			if (Objects.has(obj, key)) {
				keys[keys.length] = key;
			}
		}
		return keys;
	};


	Objects.values = function(obj) {
		var values = [];
		for (var key in obj) {
			if (Objects.has(obj, key)) {
				values.push(obj[key]);
			}
		}
		return values;
	};


	Objects.methods = function(obj) {
		var names = [];
		for (var key in obj) {
			if (Objects.isFunction(obj[key])) {
				names.push(key);
			}
		}
		return names.sort();
	};


	Objects.has = function(obj, key) {
		return Object.prototype.hasOwnProperty.call(obj, key);
	};


	Objects.isObject = function(obj) {
		return obj === Object(obj);
	};


	/**
	 * Returns true if o is a DOM node
	 * @param {Object} o
	 * @return {Boolean}
	 */
	Objects.isNode = function(obj) {
		return obj && typeof obj === "object" && typeof obj.nodeType === "number" && typeof obj.nodeName==="string";
	};


	/**
	 * Returns true if o is a DOM Element
	 * @param {Object} o
	 * @return {Boolean}
	 */
	Objects.isElement = function(obj) {
		return obj && typeof obj === "object" && obj.nodeType === 1 && typeof obj.nodeName==="string";
	};


	/**
	 * Returns true if o is a String
	 * @param {Object} o
	 * @return {Boolean}
	 */
	Objects.isString = function(obj) {
		return (typeof obj === "string" || obj instanceof String);
	};


	/**
	 * Returns true if o is an Array
	 * @param {Object} o
	 * @return {Boolean}
	 */
	Objects.isArray = function(obj) {
		return obj && (obj instanceof Array || typeof obj === "array");
	};


	/**
	 * Returns true if o is an Arguments object
	 * @param {Object} o
	 * @return {Boolean}
	 */
	Objects.isArguments = function(obj) {
		return obj && obj.callee;
	};


	/**
	 * Returns true if o is a Function
	 * @param {Object} o
	 * @return {Boolean}
	 */
	Objects.isFunction = function(obj) {
		return Object.prototype.toString.call(obj) === "[object Function]";
	};


	/**
	 * Returns true if o is an Object
	 * @param {Object} o
	 * @return {Boolean}
	 */
	Objects.isObject = function(obj) {
		return obj !== undefined && (obj === null || typeof obj === "object");
	};


	/**
	 * Returns true if o is an Object constructed by constructor
	 * @param {Object} o
	 * @param {Function} constructor
	 * @return {Boolean}
	 */
	Objects.is = function(obj, constructor) {
		return obj && obj.constructor && obj.constructor === constructor;
	};


	return Objects;

});
