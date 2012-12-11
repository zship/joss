define(function(require){

	var Size = require('joss/geometry/Size');
	var lang = require('dojo/_base/lang');



	module('joss/geometry/Size');

	test('scale', function() {
		var smaller = new Size({width: 50, height: 50});
		var larger = new Size({width: 150, height: 100});

		//grow to larger size
		var size = lang.clone(smaller);
		size.scale(larger, Size.ScaleMode.Equal);
		strictEqual(size.width, 150, 'scale (50, 50) -> (150, 100), mode = Equal: width');
		strictEqual(size.height, 100, 'scale (50, 50) -> (150, 100), mode = Equal: height');

		size = lang.clone(smaller);
		size.scale(larger, Size.ScaleMode.Contain);
		strictEqual(size.width, 100, 'scale (50, 50) -> (150, 100), mode = Contain: width');
		strictEqual(size.height, 100, 'scale (50, 50) -> (150, 100), mode = Contain: height');

		size = lang.clone(smaller);
		size.scale(larger, Size.ScaleMode.Cover);
		strictEqual(size.width, 150, 'scale (50, 50) -> (150, 100), mode = Cover: width');
		strictEqual(size.height, 150, 'scale (50, 50) -> (150, 100), mode = Cover: height');

		//shrink to smaller size
		size = lang.clone(larger);
		size.scale(smaller, Size.ScaleMode.Equal);
		strictEqual(size.width, 50, 'scale (150, 100) -> (50, 50), mode = Equal: width');
		strictEqual(size.height, 50, 'scale (150, 100) -> (50, 50), mode = Equal: height');

		size = lang.clone(larger);
		size.scale(smaller, Size.ScaleMode.Contain);
		strictEqual(size.width, 50, 'scale (150, 100) -> (50, 50), mode = Contain: width');
		strictEqual(Math.round(size.height), 33, 'scale (150, 100) -> (50, 50), mode = Contain: height');

		size = lang.clone(larger);
		size.scale(smaller, Size.ScaleMode.Cover);
		strictEqual(size.width, 75, 'scale (150, 100) -> (50, 50), mode = Cover: width');
		strictEqual(size.height, 50, 'scale (150, 100) -> (50, 50), mode = Cover: height');
	});

});
