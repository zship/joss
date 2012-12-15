define(function(require) {

	var forOwn = require('amd-utils/object/forOwn');


	/**
	 * Apply properties in `opts` against all same-named property setters
	 * defined within `context`
	 * @param {Object} opts
	 * @param {Object} context
	 */
	var apply = function(opts, context) {
		var descriptors = context.constructor._meta.descriptors;

		//set _data before calling setters, in case setter refers to other
		//properties in _data
		forOwn(opts, function(val, key) {
			if (descriptors[key]) {
				context._data[key] = opts[key];
			}
		});

		forOwn(opts, function(val, key) {
			if (descriptors[key] && descriptors[key].set) {
				descriptors[key].set.call(context, val);
			}
		});
	};


	return apply;

});
