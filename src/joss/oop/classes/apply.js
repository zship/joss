define(function(require) {

	var forOwn = require('amd-utils/object/forOwn');


	var apply = function(opts, context) {
		//1. simple merge of defaults and options arg
		//children of _data are merged one-by-one, to avoid overwriting _target
		//object references in proxies (see defineProp.js)
		context._data = opts;

		//2. call all defined properties with keys matching the defaults
		//object. This is done in case property descriptors mutate state other
		//than their own key in the _data object.
		var descriptors = context.constructor._meta.descriptors;
		forOwn(context._data, function(val, key) {
			if (descriptors[key] && descriptors[key].set) {
				descriptors[key].set.call(context, val);
			}
		});
	};


	return apply;

});
