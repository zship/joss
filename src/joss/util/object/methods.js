define(['amd-utils/lang/isFunction'], function (isFunction) {

	var methods = function(obj) {
		var names = [];
		for (var key in obj) {
			if (isFunction(obj[key])) {
				names.push(key);
			}
		}
		return names.sort();
	};

	return methods;

});
