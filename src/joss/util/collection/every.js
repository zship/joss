define(['amd-utils/lang/isArray', 'amd-utils/object/hasOwn'], function (isArray, hasOwn) {

	function every(list, iterator, context) {
		list = list || [];
		var result = true;

		if (isArray(list)) {
			for (var i = 0, l = list.length; i < l; i++) {
				if (iterator.call(context, list[i], i, list) === false) {
					result = false;
					break;
				}
			}
		}
		else {
			for (var key in list) {
				if (!hasOwn(list, key)) {
					continue;
				}
				if (iterator.call(context, list[key], key, list) === false) {
					result = false;
					break;
				}
			}
		}

		return result;
	}

	return every;

});
