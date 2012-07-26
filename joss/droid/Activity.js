(function(window, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['joss/dojo', 'joss/mvc/Controller'], factory);
	} else {
		// Browser globals
		dojo.setObject('joss.droid.Activity', factory(dojo, joss.mvc.Controller));
	}
})(this, function(dojo, Controller) {

	return dojo.declare(Controller, {

		constructor: function(opts) {

			this._fragments = {};

		},

		_fragments: null,

		fragments: function(name) {
			if (!name) {
				return this._fragments;
			}
			return this._fragments[name];
		},

		start: function(intent) {
			$.each(this.fragments(), function(i, fragment) {
				fragment.render();
			});
		},

		/*
		 * launch a new Activity with the
		 * specified Intent
		 */
		launch: function(intent) {
			dojo.publish('_system:launch', intent);
		},

		publish: function(message) {
			dojo.publish('_system', message);
		}
	
	});

});
