define(function(require) {

	var forOwn = require('amd-utils/object/forOwn');
	var forEach = require('amd-utils/collection/forEach');
	var isObject = require('amd-utils/lang/isObject');
	var clone = require('amd-utils/lang/clone');


	//custom mixin fn, skipping mixing-in of properties not defined on the
	//target
	var _deepMixIn = function(target) {
		var i = 0;

		while(++i < arguments.length){
			var obj = arguments[i];
			if (obj !== null && obj !== undefined) {
				forEach(obj, _copyProp, target);
			}
		}

		return target;
	};


	var _copyProp = function(val, key) {
		if (!this.hasOwnProperty(key)) {
			return;
		}

		var existing = this[key];
		//deep merge only objects
		if (val && isObject(val)) {
			_deepMixIn(existing, val);
		} else {
			this[key] = val;
		}
	};


	/**
	 * Create _data object by mixing-in properties from `opts` into `defaults`,
	 * then applying all matching property setters
	 * @param {Object} defaults
	 * @param {Object} opts
	 * @param {Constructor} context
	 */
	var apply = function(defaults, opts, context) {
		//1. simple merge of defaults and options arg
		context._data = _deepMixIn(clone(defaults), opts);

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
