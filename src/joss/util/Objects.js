/*
 * Static utility methods dealing with Objects
 */
define(function(require) {

	var $ = require('jquery');


	var Objects = {

		/**
		 * Returns true if o is a DOM node
		 * @param {Object} o
		 * @return {Boolean}
		 */
		isNode: function(o){
			return o && typeof o === "object" && typeof o.nodeType === "number" && typeof o.nodeName==="string";
		},


		/**
		 * Returns true if o is a DOM Element
		 * @param {Object} o
		 * @return {Boolean}
		 */
		isElement: function(o){
			return o && typeof o === "object" && o.nodeType === 1 && typeof o.nodeName==="string";
		},


		/**
		 * Returns true if o is a non-empty jQuery element
		 * @param {Object} o
		 * @return {Boolean}
		 */
		isJQuery: function(o) {
			return Objects.is(o, $) && o.length;
		},


		/**
		 * Returns true if o is a String
		 * @param {Object} o
		 * @return {Boolean}
		 */
		isString: function(o) {
			return (typeof o === "string" || o instanceof String);
		},


		/**
		 * Returns true if o is an Array
		 * @param {Object} o
		 * @return {Boolean}
		 */
		isArray: function(o) {
			return o && (o instanceof Array || typeof o === "array");
		},


		/**
		 * Returns true if o is a Function
		 * @param {Object} o
		 * @return {Boolean}
		 */
		isFunction: function(o) {
			return Object.prototype.toString.call(o) === "[object Function]";
		},


		/**
		 * Returns true if o is an Object
		 * @param {Object} o
		 * @return {Boolean}
		 */
		isObject: function(o) {
			return o !== undefined && (o === null || typeof o === "object");
		},


		/**
		 * Returns true if o is an Object constructed by constructor
		 * @param {Object} o
		 * @param {Function} constructor
		 * @return {Boolean}
		 */
		is: function(o, constructor) {
			return o && o.constructor && o.constructor === constructor;
		}

	};

	return Objects;

});
