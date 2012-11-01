/*
 * Static utility methods dealing with Functions
 */
define(function() {


	/**
	 * @namespace
	 * @alias joss.util.Functions
	 */
	var Functions = {};


	/**
	 * Returns a function that will not be called as long as it continues to be
	 * invoked within the given ms delay.
	 * @param {Function} fn
	 * @param {Number} ms
	 * @return {Function}
	 */
	Functions.debounce = function(fn, ms, immediate) {
		var timeout, result;
		return function() {
			var context = this, args = arguments;
			var later = function() {
				timeout = null;
				if (!immediate) {
					result = fn.apply(context, args);
				}
			};
			var callNow = immediate && !timeout;
			clearTimeout(timeout);
			timeout = setTimeout(later, ms);
			if (callNow) {
				result = fn.apply(context, args);
			}
			return result;
		};
	};


	/**
	 * Returns a function which will be invoked once every **ms** milliseconds
	 * @param {Function} fn
	 * @param {Number} ms
	 * @return {Function}
	 */
	Functions.throttle = function(fn, ms) {
		var context, args, timeout, result;
		var previous = 0;
		var later = function() {
			previous = new Date();
			timeout = null;
			result = fn.apply(context, args);
		};

		var throttled = function() {
			var now = new Date();
			var remaining = ms - (now - previous);
			context = this;
			args = arguments;
			if (remaining <= 0) {
				clearTimeout(timeout);
				previous = now;
				result = fn.apply(context, args);
			} else if (!timeout) {
				timeout = setTimeout(later, remaining);
			}
			return result;
		};

		return throttled;
	};


	/**
	 * Returns a function which will execute in **ms** milliseconds, unless
	 * cancelled by Functions#cancel
	 * @param {Function} fn
	 * @param {Number} ms
	 * @return {Function}
	 */
	Functions.delay = function(fn, ms) {
		var args = Array.prototype.slice.call(arguments, 2);
		return setTimeout(function(){ 
			return fn.apply(null, args); 
		}, ms);
	};


	/**
	 * Returns a function which will run after the current call stack has
	 * cleared.
	 * @param {Function} fn
	 * @param {Number} ms
	 * @return {Function}
	 */
	Functions.defer = function(fn) {
		return Functions.delay.apply(Functions, [fn, 1].concat(Array.prototype.slice.call(arguments, 1)));
	};


	return Functions;

});
