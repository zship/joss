define(function(require) {

	var Class = require('class/Class');


	var Lifecycle = Class.extend(/** @lends Lifecycle.prototype */{

		__chains: {
			start: 'after',
			stop: 'before'
		},


		/**
		 * @constructs
		 * @extends {joss/oop/Class}
		 */
		constructor: function() {
			this._lifecycle_running = false;
		},


		start: function() {
			this._lifecycle_running = true;
		},


		stop: function() {
			this._lifecycle_running = false;
		},


		isRunning: function() {
			return this._lifecycle_running;
		}

	});


	return Lifecycle;

});
