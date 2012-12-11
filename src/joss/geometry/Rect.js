define(function(require) {

	var lang = require('dojo/_base/lang');
	var defaults = require('amd-utils/lang/defaults');
	var Point = require('./Point');
	var Position = require('./Position');
	var Classes = require('joss/util/Classes');


	//Describes a rectangle in two-dimensional space
	var Rect = Classes.create(/** @lends joss/geometry/Rect.prototype */ {

		/**
		 * @class
		 * @param {Object} opts : the coordinates of the rectangle.
		 * four of these properties are required: any four that
		 * can logically be used to construct a rectangle.
		 * @constructs
		 */
		constructor: function(opts) {
			if (!arguments.length) {
				opts = {
					top: 0,
					left: 0,
					width: 0,
					height: 0
				};
			}

			opts.top = defaults(opts.top, opts.t);
			opts.right = defaults(opts.right, opts.r);
			opts.bottom = defaults(opts.bottom, opts.b);
			opts.left = defaults(opts.left, opts.l);
			opts.width = defaults(opts.width, opts.w);
			opts.height = defaults(opts.height, opts.h);

			if (opts.top === undefined) {
				opts.top = opts.bottom - opts.height;
			}

			if (opts.left === undefined) {
				opts.left = opts.right - opts.width;
			}

			if (opts.width === undefined) {
				opts.width = opts.right - opts.left;
			}

			if (opts.height === undefined) {
				opts.height = opts.bottom - opts.top;
			}

			/** @type {Number} */
			this.top = opts.top;
			/** @type {Number} */
			this.left = opts.left;
			/** @type {Number} */
			this.width = opts.width;
			/** @type {Number} */
			this.height = opts.height;
		},


		'get right': function() {
			return this._data.left + this._data.width;
		},


		'get bottom': function() {
			return this._data.top + this._data.height;
		},


		/**
		 * @param {Number} dx
		 * @param {Number} dy
		 * @return {joss/geometry/Rect}
		 */
		translate: function(dx, dy) {
			this.left += dx;
			this.top += dy;
			return this;
		},


		/**
		 * @param {Number} y
		 * @return {joss/geometry/Rect}
		 */
		moveBottom: function(y) {
			return this.moveTo(new Point(this.left, y - this.height));
		},


		/**
		 * @param {joss/geometry/Point} p
		 * @return {joss/geometry/Rect}
		 */
		moveBottomLeft: function(p) {
			return this.moveTo(new Point(p.x, p.y - this.height));
		},


		/**
		 * @param {joss/geometry/Point} p
		 * @return {joss/geometry/Rect}
		 */
		moveBottomRight: function(p) {
			return this.moveTo(new Point(p.x - this.width, p.y - this.height));
		},


		/**
		 * @param {joss/geometry/Point} p
		 * @return {joss/geometry/Rect}
		 */
		moveCenter: function(p) {
			var offset_x = p.x - this.center.x;
			var offset_y = p.y - this.center.y;
			return this.translate(offset_x, offset_y);
		},


		/**
		 * @param {Number} x
		 * @return {joss/geometry/Rect}
		 */
		moveLeft: function(x) {
			return this.moveTo(new Point(x, this.top));
		},


		/**
		 * @param {Number} x
		 * @return {joss/geometry/Rect}
		 */
		moveRight: function(x) {
			return this.moveTo(new Point(x - this.width, this.top));
		},


		/**
		 * @param {joss/geometry/Point} p
		 * @return {joss/geometry/Rect}
		 */
		moveTo: function(p) {
			return this.translate(
				p.x - this.left,
				p.y - this.top
			);
		},


		/**
		 * @param {Number} y
		 * @return {joss/geometry/Rect}
		 */
		moveTop: function(y) {
			return this.moveTo(new Point(this.left, y));
		},


		/**
		 * @param {joss/geometry/Point} p
		 * @return {joss/geometry/Rect}
		 */
		moveTopLeft: function(p) {
			return this.moveTo(p);
		},


		/**
		 * @param {joss/geometry/Point} p
		 * @return {joss/geometry/Rect}
		 */
		moveTopRight: function(p) {
			return this.moveTo(new Point(p.x - this.width, p.y));
		},


		/**
		 * Shorthand for relative positioning to another Rectangle
		 * object; an alternative to the move\* and center\* methods
		 * using {joss/geometry/Position} objects.
		 *
		 * @param {Object} opts
		 * @return {joss/geometry/Rect}
		 */
		position: function(opts) {
			opts = lang.mixin({
				my: null, //string or Position
				at: null, //string or Position
				of: null, //joss/geometry/Rect
				offset: null //{x, y} || {by:Number, towards:Point|awayFrom:Point}
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
			switch(opts.at.x) {
			case 'left':
				dest.x = opts.of.left;
				break;
			case 'center':
				dest.x = opts.of.center.x;
				break;
			case 'right':
				dest.x = opts.of.right;
				break;
			}

			switch(opts.at.y) {
			case 'top':
				dest.y = opts.of.top;
				break;
			case 'center':
				dest.y = opts.of.center.y;
				break;
			case 'bottom':
				dest.y = opts.of.bottom;
				break;
			}

			//move the rectangle.  start at the center as a baseline.
			this.moveCenter(opts.of.center);

			switch(opts.my.x) {
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

			switch(opts.my.y) {
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

			if (!opts.offset) {
				return this;
			}

			//finally, apply any requested offset
			//absolute offset
			if (opts.offset.x || opts.offset.y) {
				this.translate(opts.offset.x || 0, opts.offset.y || 0);
			}
			//relative offset
			else if (opts.offset.by) {
				var p;
				if (opts.offset.towards) {
					p = this.center.moveBy(opts.offset.by, 'towards', opts.offset.towards);
					this.moveCenter(p);
				}
				else if (opts.offset.awayFrom) {
					p = this.center.moveBy(opts.offset.by, 'awayFrom', opts.offset.awayFrom);
					this.moveCenter(p);
				}
			}

			return this;
		},


		/** @type {Number} */
		width: null,


		/** @type {Number} */
		height: null,


		/**
		 * @param {joss/geometry/Point|joss/geometry/Rect} target
		 * @return {Boolean}
		 */
		contains: function(target) {
			if (target.constructor === Point) {
				return this._containsPoint(target);
			}
			else if (target.constructor === Rect) {
				return this._containsRect(target);
			}
		},


		_containsPoint: function(p) {
			return (p.x >= this.left && p.x <= this.right && p.y >= this.top && p.y <= this.bottom);
		},


		_containsRect: function(rect) {
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


		/**
		 * @param {joss/geometry/Rect} rect
		 * @return {Boolean}
		 */
		intersects: function(rect) {
			var self = this.normalized();
			var other = rect.normalized();

			//is outside of
			if (self.left > other.right || self.right < other.left) {
				return false;
			}

			//is outside of
			if (self.top > other.bottom || self.bottom < other.top) {
				return false;
			}

			//is fully contained by
			if (self.contains(other)) {
				return false;
			}

			return true;
		},


		/** @type {joss/geometry/Point} */
		center: null,


		'get center': function() {
			var center = this.left + (this.right - this.left) / 2;
			var middle = this.top + (this.bottom - this.top) / 2;
			return new Point(center, middle);
		},


		'set center': function(p) {
			this.moveCenter(p);
		},


		/** @type {joss/geometry/Point} */
		topLeft: null,


		'get topLeft': function() {
			return new Point(this.left, this.top);
		},


		'set topLeft': function(p) {
			this.top = p.y;
			this.left = p.x;
		},


		/** @type {joss/geometry/Point} */
		topRight: null,


		'get topRight': function() {
			return new Point(this.right, this.top);
		},


		'set topRight': function(p) {
			this.top = p.y;
			this.right = p.x;
		},


		/** @type {joss/geometry/Point} */
		bottomLeft: null,


		'get bottomLeft': function() {
			return new Point(this.left, this.bottom);
		},


		'set bottomLeft': function(p) {
			this.bottom = p.y;
			this.left = p.x;
		},


		/** @type {joss/geometry/Point} */
		bottomRight: null,


		'get bottomRight': function() {
			return new Point(this.right, this.bottom);
		},


		'set bottomRight': function(p) {
			this.bottom = p.y;
			this.right = p.x;
		},


		/**
		 * @param {joss/geometry/Rect} rect
		 * @return {joss/geometry/Rect}
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


		/**
		 * @param {joss/geometry/Rect} rect
		 * @return {joss/geometry/Rect}
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


		/**
		 * @return {joss/geometry/Rect}
		 */
		normalized: function() {
			var rect = this.clone();
			if (rect.width < 0) {
				rect.left = rect.right;
				rect.width = Math.abs(rect.width);
			}
			if (rect.height < 0) {
				rect.top = rect.bottom;
				rect.height = Math.abs(rect.height);
			}
			return rect;
		},


		toString: function() {
			return 'Rect' + 
				' t:' + this.top + 
				' l:' + this.left + 
				' r:' + this.right + 
				' b:' + this.bottom +
				' w:' + this.width +
				' h:' + this.height;
		}
		
	});


	Classes.defineProp(Rect, 'top');
	Classes.defineProp(Rect, 'left');
	Classes.defineProp(Rect, 'width');
	Classes.defineProp(Rect, 'height');


	return Rect;


});
