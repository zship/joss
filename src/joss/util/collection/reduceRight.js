define(['./map', './pluck', './reduce'], function (map, pluck, reduce) {

    function reduceRight(list, iterator, memo, context) {
		list = list || [];

		var reversed = map(list, function(val, i) {
			return {index: i, value: val};
		}).reverse();

		reversed = pluck(reversed, 'value');

		return reduce(reversed, iterator, memo, context);
    }

    return reduceRight;

});
