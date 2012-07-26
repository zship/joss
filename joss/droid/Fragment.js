(function(window, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['joss/dojo', 'joss/droid/Activity'], factory);
	} else {
		// Browser globals
		dojo.setObject('joss.droid.Fragment', factory(dojo, joss.droid.Activity));
	}
})(this, function(dojo, Activity) {

	return dojo.declare(Activity, {

		constructor: function(opts) {


		},

		_activity: null,

		/*
		 * pass a message to this Fragment's
		 * parent Activity
		 */
		publish: function(key, args) {
			this._activity[key].apply(this._activity, Array.prototype.slice.call(arguments, 1));
		}

	
	});

});
