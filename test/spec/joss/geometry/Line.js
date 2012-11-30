define(function(require){

	var Line = require('joss/geometry/Line');
	var Point = require('joss/geometry/Point');



	module('joss/geometry/Line');


	test('Basics', function() {
		var line = new Line({
			p1: new Point(0, 0),
			p2: new Point(1, 1)
		});

		strictEqual(line.m, 1, 'slope correct');
		strictEqual(line.b, 0, 'y-intercept correct');

		line.translate(1, 0);

		strictEqual(line.p1.x, 1, 'translate(1, 0): p1.x moved');
		strictEqual(line.p1.y, 0, 'translate(1, 0): p1.y unchanged');
		strictEqual(line.p2.x, 2, 'translate(1, 0): p2.x moved');
		strictEqual(line.p2.y, 1, 'translate(1, 0): p2.y unchanged');
		strictEqual(line.m, 1, 'translate(1, 0): slope unchanged');
		strictEqual(line.b, 1, 'translate(1, 0): y-intercept correct');
	});


	test('Intersection', function() {
		var line = new Line({
			p1: new Point(0, 0),
			p2: new Point(1, 0)
		});

		var line2 = new Line({
			p1: new Point(1, -1),
			p2: new Point(1, 0)
		});

		var intersection = line.intersection(line2);

		strictEqual(intersection.x, 1, 'intersection x correct');
		strictEqual(intersection.y, 0, 'intersection y correct');
	});

});
