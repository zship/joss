define(function(require) {

	var forEach = require('amd-utils/collection/forEach');
	var isObject = require('amd-utils/lang/isObject');


	/**
	 * Combine properties from `sources` into `target`, recursively mixing
	 * child objects and skipping null/undefined values
	 * @param {Object} target
	 * @param {...Object} sources
	 * @return {Object}
	 */
	var defaults = function(target) {
		var i = 0;

		while(++i < arguments.length){
			var obj = arguments[i];
			if (obj !== null && obj !== undefined) {
				forEach(obj, function(val, key) {
					if (!target.hasOwnProperty(key)) {
						return;
					}

					//deep merge only objects
					if (val && isObject(val)) {
						defaults(target[key], val);
					} else {
						target[key] = val;
					}
				});
			}
		}

		return target;
	};


	return defaults;

});
