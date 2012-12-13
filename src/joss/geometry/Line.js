define(function(require) {

	var Classes = require('joss/oop/Classes');
	var Point = require('./Point');


	//Describes a line in two-dimensional space
	var Line = Classes.create(/** @lends joss/geometry/Line.prototype */ {

		'-accessors-': ['p1', 'p2', 'm', 'b'],


		/**
		 * @param {joss/geometry/Point} p1
		 * @param {joss/geometry/Point} p2
		 * @constructs
		 */
		constructor: function(opts) {
			if (opts.p1 && opts.p2) {
				this.p1 = opts.p1;
				this.p2 = opts.p2;
			}

			if (opts.m && opts.b) {
				var line = Line.fromSlopeIntercept(opts.m, opts.b);
				this.p1 = line.p1;
				this.p2 = line.p2;
			}
		},


		/** @type {joss/geometry/Point} */
		p1: null,


		/** @type {joss/geometry/Point} */
		p2: null,


		/** @type {joss/geometry/Point} */
		m: {
			get: function() {
				if (this.p1.x - this.p2.x === 0) {
					return null;
				}
				return (this.p1.y - this.p2.y) / (this.p1.x - this.p2.x);
			}
		},


		/** @type {Number} */
		b: {
			get: function() {
				if (this.m === null) {
					return null;
				}
				return this.m * this.p1.x - this.p1.y;
			}
		},


		/**
		 * @param {Number} dx
		 * @param {Number} dy
		 * @return {joss/geometry/Point}
		 */
		translate: function(dx, dy) {
			return new Line(
				this.p1.translate(dx, dy),
				this.p2.translate(dx, dy)
			);
		},


		/**
		 * @param {joss/geometry/Line} other
		 * @return {joss/geometry/Point|void}
		 */
		intersection: function(other) {

			var a1 = this.p1;
			var a2 = this.p2;
			var b1 = other.p1;
			var b2 = other.p2;

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
				return undefined; //coincident or parallel
			}
			
		}

	});


	/**
	 * @param {Number} m
	 * @param {Number} b
	 * @return {joss/geometry/Line}
	 */
	Line.fromSlopeIntercept = function(m, b) {

		var p1 = new Point(0, b);
		var p2 = new Point(1, m + b);
		return new Line(p1, p2);
	
	};


	return Line;

});
