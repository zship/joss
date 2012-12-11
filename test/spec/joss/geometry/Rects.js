define(function(require){

	var Rects = require('joss/geometry/Rects');
	var Rect = require('joss/geometry/Rect');
	var lang = require('dojo/_base/lang');




	module('joss/geometry/Rects');

	var tpl = new Rect({
		top: 0,
		left: 0,
		width: 100,
		height: 100
	});


	test('Align', function() {
		var rect = lang.clone(tpl);
		var rect2 = lang.clone(tpl);
		var orig = lang.clone(tpl);

		rect.translate(0, 10);
		rect2.translate(0, 20);
		Rects.align([rect, rect2], 'y', 'top');
		strictEqual(rect.top, 10, 'rect: align (y, top) sets top=<min y>');
		strictEqual(rect2.top, 10, 'rect2: align (y, top) sets top=<min y>');

		var pass;
		pass = (rect.left === orig.left && rect.width === orig.width && rect.height === orig.height);
		ok(pass, 'rect: align (y, top) does not alter left, width, or height');
		pass = (rect2.left === orig.left && rect2.width === orig.width && rect2.height === orig.height);
		ok(pass, 'rect2: align (y, top) does not alter left, width, or height');

		rect = lang.clone(tpl);
		rect2 = lang.clone(tpl);
		orig = lang.clone(tpl);

		rect.translate(10, 0);
		rect2.translate(20, 0);
		Rects.align([rect, rect2], 'x', 'right');
		strictEqual(rect.right, 120, 'rect: align (x, right) sets right=<max x>');
		strictEqual(rect2.right, 120, 'rect2: align (x, right) sets right=<max x>');

		pass = (rect.top === orig.top && rect.width === orig.width && rect.height === orig.height);
		ok(pass, 'rect: align (x, right) does not alter top, width, or height');
		pass = (rect2.top === orig.top && rect2.width === orig.width && rect2.height === orig.height);
		ok(pass, 'rect2: align (x, right) does not alter top, width, or height');
	});


	test('Distribute', function() {
		var rect = lang.clone(tpl);
		//rect to the left of rect2, with 10px between
		rect.position({
			my: 'right',
			at: 'left',
			of: rect
		}).translate(-10, 0);

		//rect2 in the middle
		var rect2 = lang.clone(tpl);

		var rect3 = lang.clone(tpl);
		//rect3 to the right of rect2, with 20px between
		rect3.position({
			my: 'left',
			at: 'right',
			of: rect2
		}).translate(20, 0);

		Rects.distribute([rect, rect2, rect3], 'x');

		strictEqual(rect.left, -110, 'distribute along x: furthest-left rectangle offset unchanged');
		strictEqual(rect3.left, 120, 'distribute along x: furthest-right rectangle offset unchanged');

		var pass = (rect2.left - rect.right === rect3.left - rect2.right);
		ok(pass, 'distribute along x: rectangles spaced evenly');

		pass = (
			rect.width === 100 &&
			rect.height === 100 &&
			rect2.width === 100 &&
			rect2.height === 100 &&
			rect3.width === 100 &&
			rect3.height === 100
		);
		ok(pass, 'distribute along x: rectangles\' widths and heights unchanged');

	});

});
