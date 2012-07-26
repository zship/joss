(function(window, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['jquery', 'joss/geometry/Point'], factory);
	} else {
		// Browser globals
		dojo.setObject('joss.util.Elements', factory(jQuery, joss.geometry.Point));
	}
})(this, function($, Point) {

	/*
	 * Static utility methods dealing with DOM Elements
	 */

	var scrollIsRelative = !($.browser.opera || $.browser.safari && $.browser.version < "532");

	var Elements = {

		/**
		 * Return a unique ID for a DOM Element,
		 * regardless of the presence of an id attribute.
		 * Uses the jQuery expando property which is set on elements when using
		 * the data() method, something like jQuery239847923 = ID.
		 * This is easy enough to code ourselves, but piggybacking on jQuery
		 * means the 'id' is more likely to already be set.
		 *
		 * @param {HTMLElement} el
		 */
		hash: function(el) {

			var ex = $.expando;
			if (el[ex]) {
				return el[ex];
			}

			//no expando property? set one by setting arbitrary data
			$(el).data('joss.util.Elements-hash-gen', '');
			return el[ex];
		
		},

		/**
		 * Returns a DOM element lying at a point
		 * @param {Point} p
		 */
		fromPoint: function(p) {

			if(!document.elementFromPoint) return null;

			if(scrollIsRelative)
			{
				p.x -= $(document).scrollLeft();
				p.y -= $(document).scrollTop();
			}

			return document.elementFromPoint(p.x, p.y);
		
		}
	
	};

	//jQuery plugin version of hash()
	$.fn.hash = function() {
		return Elements.hash(this[0]);
	};

	return Elements;

});
