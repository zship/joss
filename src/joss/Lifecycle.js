define(function(require) {

	var Classes = require('joss/util/Classes');



	var Lifecycle = Classes.create({

		'-chains-': {
			start: 'deferredAfter',
			stop: 'deferredBefore'
		},


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
