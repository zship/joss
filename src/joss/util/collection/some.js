define(['./every'], function (every) {

    function some(list, iterator, context) {
		list = list || [];
		var result = false;

		every(list, function(value, index, list) {
			if (iterator.call(context, value, index, list) === true) {
				result = true;
				return false; //break
			}
		});

		return !!result;
    }

    return some;

});
