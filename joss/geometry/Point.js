/*jshint undef:true, smarttabs:true, laxbreak:true, curly:true, eqeqeq:true, nonew:true, latedef:true, sub:true*/
/*global window:false, console:false, define:false, require:false*/

define(['joss/dojo'], function(dojo) {

	var Point = dojo.declare(null, /** @lends joss.geometry.Point.prototype */ {

		/** 
		 * @class Point
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
		 * @param {Number} dx Pixels to translate horizontally
		 * @param {Number} dy Pixels to translate vertically
		 * @return {Point}
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
 * @name joss.geometry.Point#translate
 * @description test
 */

/**

@name joss.geometry.Point
@description
---
test2
---

*/
