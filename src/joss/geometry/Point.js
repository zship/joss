define(function(require) {

	var declare = require('dojo/_base/declare');



	var Point = declare(null, /** @lends joss.geometry.Point.prototype */ {

		/** 
		 * @param {Number} x
		 * @param {Number} y
		 * @constructs
		 */
		constructor: function(x, y) {
			this.x = x || 0;
			this.y = y || 0;
			return this;
		},

		/**
		 * Move a point
		 * @param {Number} dx Pixels to translate horizontally
		 * @param {Number} dy Pixels to translate vertically
		 * @return {joss.geometry.Point}
		 */
		translate: function(dx, dy) {
			return new Point(
				this.x + dx,
				this.y + dy
			);
		}

	});

	return Point;

});


/**
 * @name joss.geometry.Point 
 * @description
 * Point describes a point in a plane. It is used as a very basic building
 * block in most of the joss geometry classes.
 */

