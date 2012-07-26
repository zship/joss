(function(window, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['jquery', 'joss/geometry/Point'], factory);
	} else {
		// Browser globals
		factory(jQuery, joss.geometry.Point);
	}
})(this, function($, Point) {

	var isRelative = !($.browser.opera || $.browser.safari && $.browser.version < "532");

	/**
	 * Returns a DOM element lying at a point
	 * @param p {Point}
	 */
	$.fromPoint = function(p) {

		if(!document.elementFromPoint) return null;

		if(isRelative)
		{
			p.x -= $(document).scrollLeft();
			p.y -= $(document).scrollTop();
		}

		return document.elementFromPoint(p.x, p.y);

	}; //jQuery.fromPoint

});
