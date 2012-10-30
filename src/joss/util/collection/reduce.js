define(['./forEach'], function (forEach) {

    function reduce(list, iterator, memo, context) {
		list = list || [];

		forEach(list, function(value, index, list) {
			memo = memo || value;
			memo = iterator.call(context, memo, value, index, list);
		});

        return memo;
    }

    return reduce;

});
