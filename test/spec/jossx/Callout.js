define(function(require){

	var $ = require('jquery');
	var Callout = require('jossx/Callout');
	var Rect = require('joss/geometry/Rect');
	var Position = require('joss/geometry/Position');
	var Point = require('joss/geometry/Point');


	module('jossx/Callout');


	var _pixel = function(canvas, p) {
		return Array.prototype.slice.apply(canvas.getContext('2d').getImageData(p.x, p.y, 1, 1).data);
	};


	//basic test on each possible callout box, checking expected colors of 2-3
	//points
	test('Rendering', function() {
		var el = $('<div></div>').appendTo('#qunit-fixture');
		var callout = new Callout({
			element: el,
			width: 50,
			height: 50,
			borderColor: 'rgb(0, 0, 0)',
			fillColor: 'rgb(0, 0, 255)'
		});

		var rect = new Rect({
			top: 0,
			left: 0,
			width: 50,
			height: 50
		});

		[
			'top left',
			'top center',
			'top right',
			'right top',
			'right center',
			'right bottom',
			'bottom right',
			'bottom center',
			'bottom left',
			'left top',
			'left center',
			'left bottom'
		].forEach(function(dir) {
			var pos = new Position(dir);

			callout.direction = pos;
			callout.render();

			var transparent = [];

			if (pos.parts[1] === 'center') {
				if (pos.precedence === 'x') {
					transparent.push(rect.pointAt(pos.parts[0] + ' top'));
					transparent.push(rect.pointAt(pos.parts[0] + ' bottom'));
				}
				else {
					transparent.push(rect.pointAt(pos.parts[0] + ' left'));
					transparent.push(rect.pointAt(pos.parts[0] + ' right'));
				}
			}
			else {
				transparent.push(rect.pointAt(pos.parts[0] + ' ' + pos.reverse().parts[1]));
			}

			transparent = transparent.map(function(p) {
				return p.moveBy(5, 'towards', rect.center).round();
			});

			transparent.forEach(function(p) {
				deepEqual(_pixel(callout.canvas, p), [0, 0, 0, 0]);
			});

			var filled = rect
				.pointAt(pos.reverse().parts[0] + ' center')
				.moveBy(5, 'towards', rect.center)
				.round();
			deepEqual(_pixel(callout.canvas, filled), [0, 0, 255, 255]);
		});
	});

});
