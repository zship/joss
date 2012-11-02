define(function(require) {

	var $ = require('jquery');
	var lang = require('dojo/_base/lang');
	var Callout = require('./Callout');
	var Position = require('joss/geometry/Position');
	var Point = require('joss/geometry/Point');
	var Rect = require('joss/geometry/Rect');
	var Classes = require('joss/util/Classes');
	var Elements = require('joss/util/Elements');
	var objectKeys = require('amd-utils/object/keys');
	require('joss/geometry/DomRect');



	var defaults = {
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
		tipSize: 12
	};

	var getset = objectKeys(defaults).concat(['tip', 'inner']);


	var Tooltip = Classes.getset(getset, null, {

		constructor: function(opts) {

			opts = lang.mixin(defaults, opts);
			opts.element = opts.element || $('<div></div>').addClass(opts.className).appendTo('body');

			Classes.applyOptions(this, opts);

			this._inner = $('<div class="inner"></div>').appendTo(this.$element);

			this._tip = new Callout({
				element: $('<div class="tip"></div>').css({position: 'absolute', width: opts.tipSize, height: opts.tipSize}).appendTo(this.$element),
				width: opts.tipSize,
				height: opts.tipSize,
				direction: this._position.reverse().toString()
			});

		},


		destroy: function() {
			this.$element.remove();
			this.tip().destroy();
		},


		hide: function() {
			this.$element.hide();
		},


		show: function() {
			this.$element.show();
		},


		_setElement: function(el) {
			this._element = Elements.fromAny(el);
			this.$element = $(this._element);
			return this;
		},


		_setTarget: function(el) {
			if (el instanceof Point) {
				this._target = el;
				return this;
			}
			this._target = Elements.fromAny(el);
			this.$target = $(this._target);
			return this;
		},


		_setPosition: function(pos) {
			this._position = new Position(pos);
			return this;
		},


		render: function() {

			var tgtRect;

			if (this.target() instanceof Point) {
				tgtRect = new Rect({
					t: this.target().y,
					l: this.target().x,
					w: 1,
					h: 1
				});
			}
			else {
				tgtRect = this.$target.rect();
			}

			if (this.borderWidth() === null) {
				this.borderWidth(parseInt(this.$element.css('border-top-width'), 10));
			}

			if (this.borderColor() === null) {
				this.borderColor(this.$element.css('border-top-color'));
			}

			if (this.backgroundColor() === null) {
				this.backgroundColor(this.$element.css('background-color'));
			}

			this.$element.show();
			var rect = this.$element.rect();
			rect
				.position({
					my: this.position().reverse(),
					at: this.position(),
					of: tgtRect,
					offset: this.offset()
				})
				.translate((function(self) {
					switch(self.position().x()) {
						case 'left':
							return -1 * self._tipSize;
						case 'right':
							return self._tipSize;
						default:
							return 0;
					}
				})(this), (function(self) {
					switch(self.position().y()) {
						case 'top':
							return -1 * self._tipSize;
						case 'bottom':
							return self._tipSize;
						default:
							return 0;
					}
				})(this))
				.apply();


			this.tip().borderWidth(this.borderWidth());
			this.tip().borderColor(this.borderColor());
			this.tip().fillColor(this.backgroundColor());
			this.tip().direction(this.position().reverse());
			this.tip().render();


			var tipInset = {};
			if (this.position().precedence() === 'x') {
				tipInset.y = 0;
				if (this.position().x() === 'left') {
					tipInset.x = -1 * rect.dimensions().border.right;
				}
				else {
					tipInset.x = rect.dimensions().border.left;
				}
			}
			else {
				tipInset.x = 0;
				if (this.position().y() === 'top') {
					tipInset.y = -1 * rect.dimensions().border.bottom;
				}
				else {
					tipInset.y = rect.dimensions().border.top;
				}
			}


			this.tip().$element.css('top', 0);
			this.tip().$element.css('left', 0);

			this.tip().$element.rect().position({
				my: this.position(),
				at: this.position().reverse(),
				of: rect,
				offset: tipInset
			}).apply();

		}

	});


	return Tooltip;

});
