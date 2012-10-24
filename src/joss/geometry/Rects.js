define(function(require) {

	var $ = require('jquery');
	var Rect = require('./Rect');
	var DomRect = require('./DomRect');
	var Point = require('./Point');



	var Rects = {

		min: function(list, axis) {
			var min = null;

			$.each(list, function(i, r) {
				var rect = r.normalized();

				switch(axis) {
				case 'x':
					min = (min === null) ? rect.left : min;
					min = Math.min(min, rect.left);
					break;
				case 'y':
					min = (min === null) ? rect.top : min;
					min = Math.min(min, rect.top);
					break;
				}
			});

			return min;
		},


		max: function(list, axis) {
			var max = null;

			$.each(list, function(i, r) {
				var rect = r.normalized();

				switch(axis) {
				case 'x':
					max = (max === null) ? rect.right : max;
					max = Math.max(max, rect.right);
					break;
				case 'y':
					max = (max === null) ? rect.bottom : max;
					max = Math.max(max, rect.bottom);
					break;
				}
			});

			return max;
		},


		align: function(list, axis, position) {

			var min = Rects.min(list, axis);
			var max = Rects.max(list, axis);
			var pos = {x: null, y: null};

			switch(axis) {
			case 'x':
				pos.x = position;
				break;
			case 'y':
				pos.y = position;
				break;
			}

			$.each(list, function(i, rect) {
				switch(pos.x) {
				case 'left':
					rect.moveLeft(min);
					break;
				case 'right':
					rect.moveRight(max);
					break;
				case 'center':
				case 'middle':
					rect.moveCenter(new Point(min + (max - min) / 2, rect.center().y));
					break;
				}

				switch(pos.y) {
				case 'top':
					rect.moveTop(min);
					break;
				case 'bottom':
					rect.moveBottom(max);
					break;
				case 'center':
				case 'middle':
					rect.moveCenter(new Point(rect.center().x, min + (max - min) / 2));
					break;
				}
			});

		},


		distribute: function(list, axis) {

			var min = Rects.min(list, axis);
			var max = Rects.max(list, axis);
			var cumulativeSize = 0;

			$.each(list, function(i, rect) {
				switch(axis) {
				case 'x':
					cumulativeSize += rect.width();
					break;
				case 'y':
					cumulativeSize += rect.height();
					break;
				}
			});

			var spacing = Math.abs((max - min - cumulativeSize) / (list.length - 1));

			$.each(list, function(i, rect) {
				var last = (i > 0) ? list[i - 1] : new Rect({l: min, r: min - spacing, t: min, b: min - spacing});
				switch(axis) {
				case 'x':
					rect.moveLeft(last.right);
					rect.translate(spacing, 0);
					break;
				case 'y':
					rect.moveTop(last.bottom);
					rect.translate(spacing, 0);
					break;
				}
			});

		},


		apply: function(list) {
			$.each(list, function(i, rect) {
				if (rect.constructor === DomRect) {
					rect.apply();
				}
			});
		}

	};

	return Rects;

});
