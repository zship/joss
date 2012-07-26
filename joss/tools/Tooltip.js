/*jshint undef:true, smarttabs:true, laxbreak:true, curly:true, eqeqeq:true, nonew:true, latedef:true, sub:true*/
/*global window:false, console:false, define:false, require:false, dojo:false, jQuery:false, joss:false*/
(function(window, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['jquery', 'joss/dojo', 'joss/tools/Callout', 'joss/geometry/Point', 'joss/geometry/Position', 'joss/geometry/Rect', 'joss/jquery/jquery.rect'], factory);
	} else {
		// Browser globals
		dojo.setObject('joss.tools.Tooltip', factory(jQuery, dojo, joss.tools.Callout, joss.geometry.Point, joss.geometry.Position, joss.geometry.Rect));
	}
})(this, function($, dojo, Callout, Point, Position, Rect) {

	return dojo.declare(null, {

		constructor: function(opts) {
			
			opts = dojo.mixin({
				target: null,
				position: Position.fromString('bottom center'),
				offset: {
					x: 0,
					y: 0
				},
				tipSize: 12,
				content: 'test'
			}, opts);

			this._target = opts.target;

			if (opts.position.constructor === String) {
				opts.position = Position.fromString(opts.position);
			}

			this._position = opts.position;
			//console.log(this._position.reverse().toString());
			this._offset = opts.offset;

			this._element = $('<div class="tooltip"></div>').appendTo('body');
			this._content = $('<div class="content"></div>').appendTo(this._element);
			this._content.html(opts.content);
			this._tip = new Callout({
				element: $('<div class="tip"></div>').css({position: 'absolute', width: opts.tipSize, height: opts.tipSize}).appendTo(this._element),
				width: opts.tipSize,
				height: opts.tipSize,
				direction: this._position.reverse().toString()
			});

		},


		destroy: function() {
			this._element.remove();
		},


		element: function(val) {
			if (val) { this._element = val; return this; }
			return this._element;
		},


		content: function(val) {
			if (val) { this._content = val; return this; }
			return this._content;
		},


		position: function(val) {
			if (val) { 
				if (val.constructor === String) {
					val = Position.fromString(val);
				}
				this._position = val; return this; 
			}
			return this._position;
		},


		/**
		 * @param {Point|jQuery} val
		 */
		target: function(val) {
			if (val) { this._target = val; return this; }
			return this._target;
		},


		offset: function(val) {
			if (val) { this._offset = val; return this; }
			return this._offset;
		},


		tip: function(val) {
			if (val) { this._tip = val; return this; }
			return this._tip;
		},


		refresh: function() {

			var tgtRect;

			if (this.target().constructor === jQuery) {
				tgtRect = this.target().rect();
			}
			else if (this.target().constructor === Point) {
				tgtRect = new Rect({
					top: this.target().y,
					left: this.target().x,
					width: 1,
					height: 1
				});
			}

			this.element().show();
			var rect = this.element().rect().position({
				my: this.position().reverse(),
				at: this.position(),
				of: tgtRect,
				offset: this.offset()
			});
			this.element().rect(rect);

			var dim = this.element().dimensions();

			this.tip().direction(this.position().reverse());
			this.tip().render();


			var tipInset = {};
			if (this.position().precedence() === 'x') {
				tipInset.x = (this.position().x() === 'left' ? -1 * dim.border.right : dim.border.left);
				tipInset.y = 0;
			}
			else {
				tipInset.x = 0;
				tipInset.y = (this.position().y() === 'top' ? -1 * dim.border.bottom : dim.border.top);
			}


			this.tip().element().css('top', 0);
			this.tip().element().css('left', 0);
			//console.log(this.tip().element()[0].offsetTop);

			var tipRect = this.tip().element().rect().position({
				my: this.position(),
				at: this.position().reverse(),
				of: rect
			});

			this.tip().element().rect(tipRect);

			tipRect = this.tip().element().rect().position({
				my: this.position(),
				at: this.position().reverse(),
				of: rect,
				offset: tipInset
			});
			this.tip().element().rect(tipRect);

		}


	});

});
