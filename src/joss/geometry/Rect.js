define(function(require) {

	var declare = require('dojo/_base/declare');
	var lang = require('dojo/_base/lang');
	var Point = require('./Point');
	var Position = require('./Position');



	//Describes a rectangle in two-dimensional Euclidian space and provides
	//methods for manipulating it.
	var Rect = declare(null, /** @lends joss.geometry.Rect.prototype */ {

		/**
		 * @class Rect
		 * @param {Object} opts : the coordinates of the rectangle.
		 * four of these properties are required: any four that
		 * can logically be used to construct a rectangle.
		 * @constructs
		 */
		constructor: function(opts) {
			opts = lang.mixin({
				top: null,
				t: null,
				right: null,
				r: null,
				bottom: null,
				b: null,
				left: null,
				l: null,
				width: null,
				w: null,
				height: null,
				h: null
			}, opts);

			opts.t = (opts.t === null) ? opts.top : opts.t;
			opts.r = (opts.r === null) ? opts.right : opts.r;
			opts.b = (opts.b === null) ? opts.bottom : opts.b;
			opts.l = (opts.l === null) ? opts.left : opts.l;
			opts.w = (opts.w === null) ? opts.width : opts.w;
			opts.h = (opts.h === null) ? opts.height : opts.h;

			if (opts.t === null) {
				opts.t = opts.b - opts.h;
			}

			if (opts.b === null) {
				opts.b = opts.t + opts.h;
			}

			if (opts.l === null) {
				opts.l = opts.r - opts.w;
			}

			if (opts.r === null) {
				opts.r = opts.l + opts.w;
			}

			/** @type {Number} */
			this.left = opts.l;
			/** @type {Number} */
			this.top = opts.t;
			/** @type {Number} */
			this.right = opts.r;
			/** @type {Number} */
			this.bottom = opts.b;

			return this;
		},

		translate: function(dx, dy) {
			this.left += dx;
			this.top += dy;
			this.right += dx;
			this.bottom += dy;
			return this;
		},

		/**
		 * Moves the rectangle vertically, leaving the rectangle's bottom edge
		 * at the given y coordinate. The rectangle's size is unchanged.
		 * @param {Number|String} [y]
		 * @return {joss.geometry.Rect}
		 */
		moveBottom: function(y) {
			return this.moveTo(new Point(this.left, y - this.height()));
		},

		moveBottomLeft: function(p) {
			return this.moveTo(new Point(p.x, p.y - this.height()));
		},

		moveBottomRight: function(p) {
			return this.moveTo(new Point(p.x - this.width(), p.y - this.height()));
		},

		moveCenter: function(p) {
			var offset_x = p.x - this.center().x;
			var offset_y = p.y - this.center().y;
			return this.translate(offset_x, offset_y);
		},

		moveLeft: function(x) {
			return this.moveTo(new Point(x, this.top));
		},

		moveRight: function(x) {
			return this.moveTo(new Point(x - this.width(), this.top));
		},

		/**
		 * Moves the rectangle, leaving the top-left corner at the given
		 * position (x, y). The rectangle's size is unchanged.
		 * @param {joss.geometry.Point} p
		 * @return {joss.geometry.Rect}
		 */
		moveTo: function(p) {
			return this.translate(
				p.x - this.left,
				p.y - this.top
			);
		},

		moveTop: function(y) {
			return this.moveTo(new Point(this.left, y));
		},

		moveTopLeft: function(p) {
			return this.moveTo(p);
		},

		moveTopRight: function(p) {
			return this.moveTo(new Point(p.x - this.width(), p.y));
		},

		centerOn: function(p) {
			return this.moveCenter(p);
		},

		center: function() {
			var center = this.left + (this.right - this.left) / 2;
			var middle = this.top + (this.bottom - this.top) / 2;
			return new Point(center, middle);
		},

		/**
		 * Shorthand for relative positioning to another Rectangle
		 * object; an alternative to the move\* and center\* methods above
		 * using Position objects.
		 *
		 * @param {Object} opts
		 * @return {joss.geometry.Rect}
		 */
		position: function(opts) {
			opts = lang.mixin({
				my: null, //string or Position
				at: null, //string or Position
				of: null, //joss.geometry.Rect
				offset: null //{x, y}
			}, opts);

			if (opts.my && opts.my.constructor === String) {
				opts.my = new Position(opts.my);
			}
			if (opts.at && opts.at.constructor === String) {
				opts.at = new Position(opts.at);
			}
			if (opts.offset && opts.offset.constructor === String) {
				var parts = opts.offset.split(' ');
				opts.offset = {
					x: parts[0],
					y: parts[1]
				};
			}

			//absolute coordinates of the point to which we're
			//moving this rectange
			var dest = new Point(0, 0);
			//console.log(opts.my, opts.at, opts.of, opts.offset);
			switch(opts.at.x()) {
			case 'left':
				dest.x = opts.of.left;
				break;
			case 'center':
				dest.x = opts.of.center().x;
				break;
			case 'right':
				dest.x = opts.of.right;
				break;
			}

			switch(opts.at.y()) {
			case 'top':
				dest.y = opts.of.top;
				break;
			case 'center':
				dest.y = opts.of.center().y;
				break;
			case 'bottom':
				dest.y = opts.of.bottom;
				break;
			}

			//move the rectangle.  start at the center as a baseline.
			this.moveCenter(opts.of.center());

			switch(opts.my.x()) {
			case 'left':
				this.moveLeft(dest.x);
				break;
			case 'center':
				//already centered
				break;
			case 'right':
				this.moveRight(dest.x);
				break;
			}

			switch(opts.my.y()) {
			case 'top':
				this.moveTop(dest.y);
				break;
			case 'center':
				//already centered
				break;
			case 'bottom':
				this.moveBottom(dest.y);
				break;
			}

			//finally, apply any requested offset
			if (opts.offset) {
				this.translate(opts.offset.x || 0, opts.offset.y || 0);
			}

			return this;
		},

		width: function(val) {
			if (val) {
				this.right = this.left + val;
				return this;
			}
			return this.right - this.left;
		},

		height: function(val) {
			if (val) {
				this.bottom = this.top + val;
				return this;
			}
			return this.bottom - this.top;
		},

		contains: function(p) {
			return (p.x >= this.left && p.x <= this.right && p.y >= this.top && p.y <= this.bottom);
		},

		containsRect: function(rect) {
			var self = this.normalized();
			var other = rect.normalized();

			if (other.left < self.left || other.right > self.right) {
				return false;
			}

			if (other.top < self.top || other.bottom > self.bottom) {
				return false;
			}

			return true;
		},

        /*
		 *containsRect: function(rect) {
		 *    return (this.top <= rect.top && this.left <= rect.left && this.right >= rect.right && this.bottom >= rect.bottom);
		 *},
         */

		topLeft: function() {
			return new Point(this.left, this.top);
		},

		topRight: function() {
			return new Point(this.right, this.top);
		},

		bottomLeft: function() {
			return new Point(this.left, this.bottom);
		},

		bottomRight: function() {
			return new Point(this.right, this.bottom);
		},

		/*
		 * Returns the bounding rectangle of this rectangle
		 * and the given rectangle
		 */
		united: function(rect) {
			var self = this.normalized();
			var other = rect.normalized();

			return new Rect({
				t: Math.min(self.top, other.top),
				l: Math.min(self.left, other.left),
				r: Math.max(self.right, other.right),
				b: Math.max(self.bottom, other.bottom)
			});
		},

		/*
		 * Return the intersection of this rectangle
		 * and the given rectangle
		 */
		intersected: function(rect) {
			if (!this.intersects(rect)) {
				return null;
			}

			var self = this.normalized();
			var other = rect.normalized();

			return new Rect({
				t: Math.max(self.top, other.top),
				l: Math.max(self.left, other.left),
				r: Math.min(self.right, other.right),
				b: Math.min(self.bottom, other.bottom)
			});
		},

		intersects: function(rect) {
			var self = this.normalized();
			var other = rect.normalized();

			//is outside of
			if (self.left >= other.right || self.right <= other.left) {
				return false;
			}

			//is outside of
			if (self.top >= other.bottom || self.bottom <= other.top) {
				return false;
			}

			//is fully contained by
			if (other.containsRect(self)) {
				return false;
			}

			return true;
		},


		/*
		 * Returns a new rectangle with a non-negative width/height.
		 * If width < 0, swap left and right.  Ditto for height.
		 */
		normalized: function() {
			if (this.width() < 0) {
				var left = this.left;
				this.left = this.right;
				this.right = left;
			}
			if (this.height() < 0) {
				var top = this.top;
				this.top = this.bottom;
				this.bottom = top;
			}
			return lang.clone(this);
		},

		toString: function() {
			return 'Rect' + 
				' t:' + this.top + 
				' l:' + this.left + 
				' r:' + this.right + 
				' b:' + this.bottom +
				' w:' + this.width() +
				' h:' + this.height();
		}
		
	});


	return Rect;


});
