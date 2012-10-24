define(function(require) {

	var $ = require('jquery');
	var declare = require('dojo/_base/declare');
	var lang = require('dojo/_base/lang');
	var Callout = require('./Callout');
	var Position = require('joss/geometry/Position');
	var Point = require('joss/geometry/Point');
	var Rect = require('joss/geometry/Rect');
	require('joss/geometry/DomRect');
	require('joss/util/Elements');



	return declare(null, {

		constructor: function(opts) {
			
			opts = lang.mixin({
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

			if (this.target().constructor === $) {
				tgtRect = this.target().rect();
			}
			else if (this.target().constructor === Point) {
				tgtRect = new Rect({
					t: this.target().y,
					l: this.target().x,
					w: 1,
					h: 1
				});
			}

			this.element().show();
			var rect = this.element().rect().position({
				my: this.position().reverse(),
				at: this.position(),
				of: tgtRect,
				offset: this.offset()
			}).apply();

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

			this.tip().element().rect().position({
				my: this.position(),
				at: this.position().reverse(),
				of: rect,
				offset: tipInset
			}).apply();

		}


	});

});
