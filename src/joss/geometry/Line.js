define(function(require) {

	var declare = require('dojo/_base/declare');
	var Point = require('./Point');



	var Line = declare(null, /** @lends joss.geometry.Line.prototype */ {
		
		/**
		 * @class Line
		 * @param {joss.geometry.Point} p1
		 * @param {joss.geometry.Point} p2
		 * @constructs
		 */
		constructor: function(p1, p2) {
			this._p1 = p1;
			this._p2 = p2;
		},

		p1: function(val) {
			if (val) {
				this._p1 = val;
				return this;
			}
			return this._p1;
		},

		p2: function(val) {
			if (val) {
				this._p2 = val;
				return this;
			}
			return this._p2;
		},

		/**
		 * Return the slope of this line
		 * @return {joss.geometry.Point}
		 */
		m: function() {
			if (this._p1.x - this._p2.x === 0) {
				return null;
			}
			return (this._p1.y - this._p2.y) / (this._p1.x - this._p2.x);
		},

		/**
		 * Return the y-intercept of this line
		 */
		b: function() {
			if (this.m() === null) {
				return null;
			}
			return this.m() * this._p1.x - this._p1.y;
		},

		translate: function(dx, dy) {
			return new Line(
				this.p1().translate(dx, dy),
				this.p2().translate(dx, dy)
			);
		},

		//intersection between two infinite lines containing the points in this
		//Line, not between line segments.
		intersection: function(other) {

			var a1 = this._p1;
			var a2 = this._p2;
			var b1 = other._p1;
			var b2 = other._p2;

			var ua_t = (b2.x - b1.x) * (a1.y - b1.y) - (b2.y - b1.y) * (a1.x - b1.x);
			//var ub_t = (a2.x - a1.x) * (a1.y - b1.y) - (a2.y - a1.y) * (a1.x - b1.x);
			var u_b  = (b2.y - b1.y) * (a2.x - a1.x) - (b2.x - b1.x) * (a2.y - a1.y);

			if ( u_b !== 0 ) {
				var ua = ua_t / u_b;
				//var ub = ub_t / u_b;

				return new Point(
					a1.x + ua * (a2.x - a1.x),
					a1.y + ua * (a2.y - a1.y)
				);
			} 
			else {
				return null; //coincident or parallel
			}
			
		}

	});

	Line.fromSlopeIntercept = function(m, b) {

		var p1 = new Point(0, b);
		var p2 = new Point(1, m + b);
		return new Line(p1, p2);
	
	};

	return Line;

});
