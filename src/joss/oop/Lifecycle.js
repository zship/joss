define(function(require) {

	var Classes = require('./Classes');


	var Lifecycle = Classes.create(/** @lends __.prototype */{

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


	Classes.chain(Lifecycle, 'start', 'after');
	Classes.chain(Lifecycle, 'stop', 'before');


	return Lifecycle;

});
