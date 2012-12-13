define(function(require){

	var Point = require('joss/geometry/Point');


	module('joss/geometry/Point');


	test('Basics', function() {
		var p = new Point(1, 1);

		strictEqual(p.x, 1, 'x correct');
		strictEqual(p.y, 1, 'y correct');

		p.translate(1, 1);

		strictEqual(p.x, 2, 'translate(1, 1): x correct');
		strictEqual(p.y, 2, 'translate(1, 1): y correct');

		var target = new Point(5, 5);

		p.moveBy(1, 'towards', target);

		strictEqual(p.x.toFixed(1), '2.7', 'moveBy 1 towards (5, 5): x correct');
		strictEqual(p.y.toFixed(1), '2.7', 'moveBy 1 towards (5, 5): y correct');
	});

});
