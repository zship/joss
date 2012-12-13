define(function(require) {

	var $ = require('jquery');
	var Classes = require('joss/oop/Classes');
	var lang = require('dojo/_base/lang');
	var Callout = require('./Callout');
	var Position = require('joss/geometry/Position');
	var Size = require('joss/geometry/Size');
	var Elements = require('joss/util/Elements');
	require('joss/geometry/DomRect');


	var Tooltip = Classes.create(/** @lends jossx/Tooltip.prototype */ {

		/**
		 * @param {Object} opts
		 * @constructs
		 */
		constructor: function(opts) {

			opts = lang.mixin({
				element: null,
				target: null,
				position: Position.fromString('bottom center'),
				className: 'tooltip',
				borderWidth: null,
				borderColor: null,
				backgroundColor: null,
				offset: {
					x: 0,
					y: 0
				},
				tipSize: new Size(12, 12)
			}, opts);

			opts.element = opts.element || $('<div></div>').addClass(opts.className).appendTo('body');

			this.element = opts.element;
			this.target = opts.target;
			this.position = opts.position;
			this.className = opts.className;
			this.borderWidth = opts.borderWidth;
			this.borderColor = opts.borderColor;
			this.backgroundColor = opts.backgroundColor;
			this.offset = opts.offset;
			this.tipSize = opts.tipSize;
			this.inner = $('<div class="inner"></div>').appendTo(this.$element);
			this.tip = new Callout({
				element: $('<div class="tip"></div>').css({position: 'absolute', width: opts.tipSize, height: opts.tipSize}).appendTo(this.$element),
				width: opts.tipSize,
				height: opts.tipSize,
				direction: this.position.reverse().toString()
			});

		},


		destroy: function() {
			this.$element.remove();
			this.tip.destroy();
		},


		hide: function() {
			this.$element.hide();
		},


		show: function() {
			this.$element.show();
		},


		_setElements: function(el) {
			this._element = Elements.fromAny(el);
			this.$element = $(this._element);
			return this;
		},


		/** @type {Element} */
		element: null,


		'set element': function(el) {
			this._setElements(el);
		},


		/** @type {jQuery} */
		$element: null,


		'set $element': function(el) {
			this._setElements(el);
		},


		/** @type {Element} */
		target: null,


		'set target': function(el) {
			this._target = Elements.fromAny(el);
			return this;
		},


		/** @type {joss/geometry/Position} */
		position: null,


		'set position': function(pos) {
			this._position = new Position(pos);
			return this;
		},


		/** @type {String} */
		className: null,


		/** @type {Number} */
		borderWidth: null,


		/** @type {String} */
		borderColor: null,


		/** @type {String} */
		backgroundColor: null,


		/** @type {Object} */
		offset: null,


		/** @type {joss/geometry/Size} */
		tipSize: null,


		/** @type {jossx/Callout} */
		tip: null,


		/** @type {Element} */
		inner: null,


		render: function(opts) {

			opts = lang.mixin({
				recalculate: true
			}, opts);

			if (opts.recalculate || !this._targetRect) {
				this._targetRect = this.$target.rect();
			}

			if (opts.recalculate || this.borderWidth === null) {
				this.borderWidth = parseInt(this.$element.css('border-top-width'), 10);
			}

			if (opts.recalculate || this.borderColor === null) {
				this.borderColor = this.$element.css('border-top-color');
			}

			if (opts.recalculate || this.backgroundColor() === null) {
				this.backgroundColor = this.$element.css('background-color');
			}

			this.$element.show();
			var rect = this.$element.rect();
			rect
				.position({
					my: this.position.reverse(),
					at: this.position,
					of: this._targetRect,
					offset: this.offset
				})
				.translate((function(self) {
					switch(self.position.x) {
						case 'left':
							return -1 * self.tipSize.width;
						case 'right':
							return self.tipSize.width;
						default:
							return 0;
					}
				})(this), (function(self) {
					switch(self.position.y) {
						case 'top':
							return -1 * self.tipSize.height;
						case 'bottom':
							return self.tipSize.height;
						default:
							return 0;
					}
				})(this))
				.apply();


			this.tip.borderWidth = this.borderWidth;
			this.tip.borderColor = this.borderColor;
			this.tip.fillColor = this.backgroundColor;
			this.tip.direction = this.position.reverse();
			this.tip.render();


			var tipInset = {};
			if (this.position.precedence === 'x') {
				tipInset.y = 0;
				if (this.position.x === 'left') {
					tipInset.x = -1 * rect.border.right;
				}
				else {
					tipInset.x = rect.border.left;
				}
			}
			else {
				tipInset.x = 0;
				if (this.position.y === 'top') {
					tipInset.y = -1 * rect.border.bottom;
				}
				else {
					tipInset.y = rect.border.top;
				}
			}


			this.tip.$element.css('top', 0);
			this.tip.$element.css('left', 0);

			this.tip.$element.rect().position({
				my: this.position,
				at: this.position.reverse(),
				of: rect,
				offset: tipInset
			}).apply();

		}

	});


	return Tooltip;

});
