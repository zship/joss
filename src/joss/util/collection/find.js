define(['./forEach'], function (forEach) {

    function find(list, iterator, context) {
		var result;
		forEach(list, function(value, index, list) {
			if (iterator.call(context, value, index, list)) {
				result = value;
				return false; //break
			}
		});
		return result;
    }

    return find;

});
