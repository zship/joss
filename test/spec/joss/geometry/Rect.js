define(function(require){

	var Rect = require('joss/geometry/Rect');
	var Point = require('joss/geometry/Point');
	var Position = require('joss/geometry/Position');
	var lang = require('dojo/_base/lang');



	module('joss/geometry/Rect');

	var tpl = new Rect({
		top: 0,
		left: 0,
		width: 100,
		height: 100
	});


	test('width & height | {t: 0, l: 0, w: 100, h: 100}', function() {
		var rect = lang.clone(tpl);
		strictEqual(rect.width, 100, '(get) width is accurate');
		strictEqual(rect.height, 100, '(get) height is accurate');

		rect.width = 200;
		strictEqual(rect.left, 0, '(set) width does not alter left');
		strictEqual(rect.width, 200, '(set) width sets the width');

		rect.height = 200;
		strictEqual(rect.top, 0, '(set) height does not alter top');
		strictEqual(rect.height, 200, '(set) height sets the height');
	});


	test('Point calculations | {t: 0, l: 0, w: 100, h: 100}', function() {
		var rect = lang.clone(tpl);

		[
			//name, x, y
			['bottomLeft', 0, 100],
			['bottomRight', 100, 100],
			['center', 50, 50],
			['topLeft', 0, 0],
			['topRight', 100, 0]
		].forEach(function(arr) {
			var name = arr[0];
			var x = arr[1];
			var y = arr[2];

			strictEqual(rect[name].constructor, Point, name + ' returns Point');
			strictEqual(rect[name].x, x, name + ': x is accurate');
			strictEqual(rect[name].y, y, name + ': y is accurate');
		});
	});


	test('Movements on a Point | rect = {t: 0, l: 0, w: 100, h: 100}; point = {x: 200, y: 200}', function() {
		var rect = lang.clone(tpl);
		var p = new Point(200, 200);

		[
			//name, top, left
			['moveBottomLeft', 100, 200],
			['moveBottomRight', 100, 100],
			['moveCenter', 150, 150],
			['moveTopLeft', 200, 200],
			['moveTopRight', 200, 100]
		].forEach(function(arr) {
			var method = arr[0];
			var top = arr[1];
			var left = arr[2];

			strictEqual(rect[method](p), rect, method + ': returns same Rect object (chaining)');
			strictEqual(rect[method](p).top, top, method + ': top is accurate');
			strictEqual(rect[method](p).left, left, method + ': left is accurate');
			strictEqual(rect[method](p).height, 100, method + ': does not alter height');
			strictEqual(rect[method](p).width, 100, method + ': does not alter width');
		});
	});


	test('Movements to an edge | rect = {t: 0, l: 0, w: 100, h: 100}; x = 200; y = 200', function() {
		var x = 200;
		var y = 200;

		[
			//name, top
			['moveBottom', 100],
			['moveTop', 200]
		].forEach(function(arr) {
			var rect = lang.clone(tpl);
			var method = arr[0];
			var top = arr[1];

			strictEqual(rect[method](y), rect, method + ': returns same Rect object (chaining)');
			strictEqual(rect[method](y).top, top, method + ': top is accurate');
			strictEqual(rect[method](y).left, 0, method + ': does not alter left');
			strictEqual(rect[method](y).height, 100, method + ': does not alter height');
			strictEqual(rect[method](y).width, 100, method + ': does not alter width');
		});

		[
			//name, left
			['moveLeft', 200],
			['moveRight', 100]
		].forEach(function(arr) {
			var rect = lang.clone(tpl);
			var method = arr[0];
			var left = arr[1];

			strictEqual(rect[method](x), rect, method + ': returns same Rect object (chaining)');
			strictEqual(rect[method](x).left, left, method + ': left is accurate');
			strictEqual(rect[method](x).top, 0, method + ': does not alter top');
			strictEqual(rect[method](x).height, 100, method + ': does not alter height');
			strictEqual(rect[method](x).width, 100, method + ': does not alter width');
		});
	});


	test('contains & intersects', function() {
		var rect = lang.clone(tpl);
		var other = lang.clone(tpl);

		var surrounding = ['top left', 'top center', 'top right', 'right center', 'bottom right', 'bottom center', 'bottom left', 'left center'];

		//move all the way around rect +1px away from center: should neither contain nor intersect
		surrounding.forEach(function(dir) {
			var pos = new Position(dir);

			other.position({
				my: pos,
				at: pos.reverse(),
				of: rect,
				offset: {
					by: 1,
					awayFrom: rect.center
				}
			});

			other.top = Math.round(other.top);
			other.left = Math.round(other.left);
			other.right = Math.round(other.right);
			other.bottom = Math.round(other.bottom);

			strictEqual(rect.contains(other), false, 'contains: {t:0, l:0, w:100, h:100} does not contain {t:' + other.top + ', l:' + other.left + ', w:' + other.width + ', h:' + other.height + '} (lying outside the ' + pos.reverse().toString() + ')');
			strictEqual(rect.intersects(other), false, 'intersects: {t:0, l:0, w:100, h:100} does not intersect {t:' + other.top + ', l:' + other.left + ', w:' + other.width + ', h:' + other.height + '} (lying outside the ' + pos.reverse().toString() + ')');
		});

		//move all the way around rect lying on edges: should not contain but should intersect
		surrounding.forEach(function(dir) {
			var pos = new Position(dir);

			other.position({
				my: pos,
				at: pos.reverse(),
				of: rect
			});

			other.top = Math.round(other.top);
			other.left = Math.round(other.left);
			other.right = Math.round(other.right);
			other.bottom = Math.round(other.bottom);

			strictEqual(rect.contains(other), false, 'contains: {t:0, l:0, w:100, h:100} does not contain {t:' + other.top + ', l:' + other.left + ', w:' + other.width + ', h:' + other.height + '} (lying against the ' + pos.reverse().toString() + ')');
			strictEqual(rect.intersects(other), true, 'intersects: {t:0, l:0, w:100, h:100} intersects {t:' + other.top + ', l:' + other.left + ', w:' + other.width + ', h:' + other.height + '} (lying against the ' + pos.reverse().toString() + ')');
		});

		//move all the way around rect +1px towards center: should not contain but should intersect
		surrounding.forEach(function(dir) {
			var pos = new Position(dir);

			other.position({
				my: pos,
				at: pos.reverse(),
				of: rect,
				offset: {
					by: 1,
					towards: rect.center
				}
			});

			other.top = Math.round(other.top);
			other.left = Math.round(other.left);
			other.right = Math.round(other.right);
			other.bottom = Math.round(other.bottom);

			strictEqual(rect.contains(other), false, 'contains: {t:0, l:0, w:100, h:100} does not contain {t:' + other.top + ', l:' + other.left + ', w:' + other.width + ', h:' + other.height + '} (lying against the ' + pos.reverse().toString() + ')');
			strictEqual(rect.intersects(other), true, 'intersects: {t:0, l:0, w:100, h:100} intersects {t:' + other.top + ', l:' + other.left + ', w:' + other.width + ', h:' + other.height + '} (lying against the ' + pos.reverse().toString() + ')');
		});

		other = new Rect({
			top: 1,
			left: 1,
			width: 99,
			height: 99
		});

		strictEqual(rect.contains(other), true, 'contains: {t:0, l:0, w:100, h:100} contains {t:1, l:1, w:99, h:99}');
		strictEqual(rect.intersects(other), false, 'intersects: {t:0, l:0, w:100, h:100} does not intersect {t:1, l:1, w:99, h:99}');
	});


	test('intersected & united', function() {
		var rect = lang.clone(tpl);
		var other = lang.clone(tpl).translate(50, 50);

		var intersected = rect.intersected(other);
		strictEqual(intersected.top, 50, 'intersected: top is accurate');
		strictEqual(intersected.left, 50, 'intersected: left is accurate');
		strictEqual(intersected.width, 50, 'intersected: width is accurate');
		strictEqual(intersected.height, 50, 'intersected: height is accurate');

		var united = rect.united(other);
		strictEqual(united.top, 0, 'united: top is accurate');
		strictEqual(united.left, 0, 'united: left is accurate');
		strictEqual(united.width, 150, 'united: width is accurate');
		strictEqual(united.height, 150, 'united: height is accurate');
	});


	test('normalized', function() {
		var rect = new Rect({
			top: 0,
			left: 0,
			right: -10,
			bottom: -10
		});

		strictEqual(rect.width, -10, 'before: width is negative');
		strictEqual(rect.height, -10, 'before: height is negative');

		rect = rect.normalized();
		strictEqual(rect.top, -10, 'after: top has changed');
		strictEqual(rect.width, 10, 'after: width is positive');
		strictEqual(rect.left, -10, 'after: left has changed');
		strictEqual(rect.height, 10, 'after: height is positive');
	});


	test('position', function() {
		var target = lang.clone(tpl);
		var rect = new Rect({
			top: 0,
			left: 0,
			width: 50,
			height: 50
		});

		var directions = [
			//position, new top, new left
			['top left', 100, 100],
			['top center', 100, 25],
			['top right', 100, -50],
			['right center', 25, -50],
			['bottom right', -50, -50],
			['bottom center', -50, 25],
			['bottom left', -50, 100],
			['left center', 25, 100],
			['center', 25, 25]
		];

		//move all around the rectangle, checking against the equivalent methods
		directions.forEach(function(arr) {
			var position = new Position(arr[0]);
			var reversed = position.reverse();
			var top = arr[1];
			var left = arr[2];

			rect.position({
				my: position,
				at: reversed,
				of: target
			});

			strictEqual(rect.top, top, position.toString() + ' against ' + reversed.toString() + ': top is accurate');
			strictEqual(rect.left, left, position.toString() + ' against ' + reversed.toString() + ': left is accurate');
			strictEqual(rect.width, 50, 'width is unchanged');
			strictEqual(rect.height, 50, 'height is unchanged');

			rect.position({
				my: position,
				at: reversed,
				of: target,
				offset: {
					x: 1,
					y: 1
				}
			});

			strictEqual(rect.top, top + 1, position.toString() + ' against ' + reversed.toString() + ' with offset: top is accurate');
			strictEqual(rect.left, left + 1, position.toString() + ' against ' + reversed.toString() + ' with offset: left is accurate');

		});
	});

});
