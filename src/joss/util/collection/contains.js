define(['./some'], function (some) {

    function contains(list, target) {
		list = list || [];
		var found = false;

		found = some(list, function(value) {
			return value === target;
		});

		return found;
    }

    return contains;

});
