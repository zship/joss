define(function(require) {

	var isObject = require('amd-utils/lang/isObject');


	var rGetter = /get\s(.*)/;
	var rSetter = /set\s(.*)/;


	var detectAccessors = function(proto) {

		var descriptors = {};

		Object.keys(proto).forEach(function(key) {
			var matches = [];
			var propName;

			if ((matches = key.match(rGetter)) !== null) {
				propName = matches[1];
				descriptors[propName] = descriptors[propName] || {};
				descriptors[propName].get = proto[key];
			}
			else if ((matches = key.match(rSetter)) !== null) {
				propName = matches[1];
				descriptors[propName] = descriptors[propName] || {};
				descriptors[propName].set = proto[key];
			}

			if (
				isObject(proto[key]) &&
				Object.keys(proto[key]).length <= 2 &&
				(
					proto[key].hasOwnProperty('get') ||
					proto[key].hasOwnProperty('set')
				)
			) {
				descriptors[key] = descriptors[key] || {};
				descriptors[key].get = proto[key].get;
				descriptors[key].set = proto[key].set;
			}
		});

		//if they don't exist, make placeholders for parents of nested properties
		Object.keys(descriptors).filter(function(key) {
			return key.search(/\./) !== -1;
		}).forEach(function(key) {
			var parts = key.split('.');
			for (var i = 0, len = parts.length; i < len - 1; i++) {
				parts.pop();
				var path = parts.join('.');
				descriptors[path] = descriptors[path] || {};
				descriptors[path].get = descriptors[path].get || undefined;
				descriptors[path].set = descriptors[path].set || undefined;
			}
		});

		return descriptors;

	};


	return detectAccessors;

});
