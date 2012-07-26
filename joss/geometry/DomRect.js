/**
 * DomRect
 *
 * Subclass of a basic Rect,
 * but tracks what dimensions of the DOM element
 * are described by this Rect (padding, margin, border),
 * or 'content-box' vs 'border-box'
 */
(function(window, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['joss/dojo', 'joss/geometry/Rect'], factory);
	} else {
		// Browser globals
		dojo.setObject('joss.geometry.DomRect', factory(dojo, joss.geometry.Rect));
	}
})(this, function(dojo, Rect) {

	var DomRect = dojo.declare(Rect, {

		constructor: function(opts) {
			opts = dojo.mixin({
				padding: true,
				margin: false,
				border: true,
				offsetDeltas: {
					top: 0,
					left: 0
				}
			}, opts);

			this.padding = opts.padding;
			this.margin = opts.margin;
			this.border = opts.border;
			this._offsetDeltas = opts.offsetDeltas;

			return this;
		},


		//DomRect is positioned relative to the *document*.
		//toRelative returns this DomRect relative to its offset parent.
		toRelative: function() {

			return new DomRect({
				top: this.top + this._offsetDeltas.top,
				left:  this.left + this._offsetDeltas.left,
				width: this.width(),
				height: this.height(),
				padding: this.padding,
				margin: this.margin,
				border: this.border
			});
		
		}
		
	});

	return DomRect;

});
