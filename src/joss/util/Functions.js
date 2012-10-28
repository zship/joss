/*
 * Static utility methods dealing with Functions
 */
define(function(require) {

	var Objects = require('./Objects');



	/**
	 * execute **after** after **ms** milliseconds, keeping a record of the
	 * timer on **fn** for later canceling.
	 */
	var setDelay = function(fn, ms, after, scope, args) {
		fn.timers = fn.timers || [];
		var index = fn.timers.length + 1;
		fn.timers.push(window.setTimeout(function(){
			fn.timers.splice(index, 1);
			after.apply(scope, args || []);
		}, ms));
	};


	var Functions = {};


	/**
	 * Returns a function that will not be called as long as it continues to be
	 * invoked within the given ms delay.
	 * @param {Function} fn
	 * @param {Number} ms
	 * @return {Function}
	 */
	Functions.debounce = function(fn, ms) {
		var debounced = function() {
			Functions.cancel(debounced);
			setDelay(debounced, ms, fn, this, arguments);
		};
		return debounced;
	};


	/**
	 * Returns a function which will be invoked once every **ms** milliseconds
	 * @param {Function} fn
	 * @param {Number} ms
	 * @return {Function}
	 */
	Functions.throttle = function(fn, ms) {
		return Functions.lazy(fn, ms, 1);
	};


	/**
	 * Returns a function which will execute in **ms** milliseconds, unless
	 * cancelled by Functions#cancel
	 * @param {Function} fn
	 * @param {Number} ms
	 * @return {Function}
	 */
	Functions.delay = function(fn, ms) {
		var args = [].slice.call(arguments, 2);
		setDelay(fn, ms, fn, fn, args);
		return fn;
	};


	/**
	 * Returns a function which will run after the current call stack has
	 * cleared.
	 * @param {Function} fn
	 * @param {Number} ms
	 * @return {Function}
	 */
	Functions.defer = function(fn) {
		return Functions.delay(fn, 1);
	};


	/**
	 * Cancels the timeout on a function **fn** previously delayed by
	 * Functions#delay
	 * @param {Function} fn
	 */
	Functions.cancel = function(fn) {
		if (!Objects.isArray(fn.timers)) {
			return fn;
		}

		while(fn.timers.length > 0) {
			window.clearTimeout(fn.timers.shift());
		}

		return fn;
	};


	/**
	 * Returns a function that will queue all calls and wait **ms**
	 * milliseconds to execute each call in the queue.
	 * @param {Function} fn
	 * @param {Number} ms
	 * @param {Number} limit
	 */
	Functions.lazy = function(fn, ms, limit) {
		var queue = [];
		var lock = false;
		limit = limit || Infinity;

		var execute = function() {
			if(lock || queue.length === 0) {
				return;
			}
			lock = true;

			var max = Math.max(queue.length - 1, 0);
			while(queue.length > max) {
				var entry = queue.shift();
				fn.apply(entry.ctx, entry.args);
			}
			setDelay(lazy, ms, function() {
				lock = false;
				execute();
			});
		};

		var lazy = function() {
			// The first call is immediate, so having 1 in the queue
			// implies two calls have already taken place.
			if(lock && queue.length > limit - 2) {
				return;
			}
			queue.push({ctx: this, args: arguments});
			execute();
		};

		return lazy;
	};


	return Functions;

});
