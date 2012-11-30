/**
 * DomRect
 *
 * Subclass of a basic Rect,
 * but tracks what dimensions of the DOM element
 * are described by this Rect (padding, margin, border),
 * or 'content-box' vs 'border-box'
 */
define(function(require) {

	var $ = require('jquery');
	var Classes = require('joss/util/Classes');
	var lang = require('dojo/_base/lang');
	var Rect = require('./Rect');
	var Elements = require('joss/util/Elements');



	//Rect subclass which can track border, padding, and margin on a DOM
	//Element, as well as read/write its dimensions from/to an Element
	var DomRect = Classes.create(Rect, /** @lends joss/geometry/DomRect.prototype */ {

		/**
		 * @class
		 * @constructs
		 */
		constructor: function(opts) {

			//if no positioning info was passed, calculate from the DOM (below)
			var shouldCalculateDimensions = !(opts.top || opts.left || opts.right || opts.bottom);

			var defaults = {
				element: null
			};

			Classes.applyOptions(this, defaults, opts);

			if (shouldCalculateDimensions) {
				this._recalculate();
			}

		},


		/**
		 * @param {Element} [el]
		 * @return {joss/geometry/DomRect|Element}
		 */
		element: function() {},


		'set element': function(el) {
			this._element = Elements.toJquery(el);
			return this;
		},


		/**
		 * @param {Object} [val]
		 * @return {joss/geometry/DomRect|Object}
		 */
		border: function() {},


		'get border': function() {
			return lang.clone(this._border);
		},


		'set border': function(val) {
			this.borderTop(val.top);
			this.borderRight(val.right);
			this.borderBottom(val.bottom);
			this.borderLeft(val.left);
			return this;
		},


		borderTop: function(val) {
			if (val) {
				this.height(this.height() - (this._border.top - val));
				this._border.top = val;
				return this;
			}
			return this._border.top;
		},


		borderRight: function(val) {
			if (val) {
				this.width(this.width() - (this._border.right - val));
				this._border.right = val;
				return this;
			}
			return this._border.right;
		},


		borderBottom: function(val) {
			if (val) {
				this.height(this.height() - (this._border.bottom - val));
				this._border.bottom = val;
				return this;
			}
			return this._border.bottom;
		},


		borderLeft: function(val) {
			if (val) {
				this.width(this.width() - (this._border.left - val));
				this._border.left = val;
				return this;
			}
			return this._border.left;
		},


		/**
		 * @param {Object} [val]
		 * @return {joss/geometry/DomRect|Object}
		 */
		margin: function() {},


		'get margin': function() {
			return lang.clone(this._margin);
		},


		'set margin': function(val) {
			this.marginTop(val.top);
			this.marginRight(val.right);
			this.marginBottom(val.bottom);
			this.marginLeft(val.left);
			return this;
		},


		marginTop: function(val) {
			if (val) {
				this._margin.top = val;
				return this;
			}
			return this._margin.top;
		},


		marginRight: function(val) {
			if (val) {
				this._margin.right = val;
				return this;
			}
			return this._margin.right;
		},


		marginBottom: function(val) {
			if (val) {
				this._margin.bottom = val;
				return this;
			}
			return this._margin.bottom;
		},


		marginLeft: function(val) {
			if (val) {
				this._margin.left = val;
				return this;
			}
			return this._margin.left;
		},


		/**
		 * @param {Object} [val]
		 * @return {joss/geometry/DomRect|Object}
		 */
		padding: function() {},


		'get padding': function() {
			return lang.clone(this._padding);
		},


		'set padding': function(val) {
			this.paddingTop(val.top);
			this.paddingRight(val.right);
			this.paddingBottom(val.bottom);
			this.paddingLeft(val.left);
			return this;
		},


		paddingTop: function(val) {
			if (val) {
				this.height(this.height() - (this._padding.top - val));
				this._padding.top = val;
				return this;
			}
			return this._padding.top;
		},


		paddingRight: function(val) {
			if (val) {
				this.width(this.width() - (this._padding.right - val));
				this._padding.right = val;
				return this;
			}
			return this._padding.right;
		},


		paddingBottom: function(val) {
			if (val) {
				this.height(this.height() - (this._padding.bottom - val));
				this._padding.bottom = val;
				return this;
			}
			return this._padding.bottom;
		},


		paddingLeft: function(val) {
			if (val) {
				this.width(this.width() - (this._padding.left - val));
				this._padding.left = val;
				return this;
			}
			return this._padding.left;
		},


		//inspect dimensions of this._element from the DOM
		_recalculate: function() {
			var dim = Elements.defaultDimensions();

			//some special cases:
			//entire document
			if (this._element[0] === document) {
				var docWidth = $(document).width();
				var docHeight = $(document).height();

				this.top = 0;
				this.left = 0;
				this.width(docWidth);
				this.height(docHeight);

				this.border = dim.border;
				this.margin = dim.margin;
				this.padding = dim.padding;

				return this;
			}

			//viewport, with scrolling
			if (this._element[0] === window) {
				var winWidth = $(window).width();
				var winHeight = $(window).height();
				var st = parseInt($(window).scrollTop(), 10);
				var sl = parseInt($(window).scrollLeft(), 10);

				this.top = st;
				this.left = sl;
				this.width(winWidth);
				this.height(winHeight);

				this.border = dim.border;
				this.margin = dim.margin;
				this.padding = dim.padding;

				return this;
			}

			var bounding;

			//regular elements, where we can ditch jQuery for most CSS
			//calculations (speed)
			this._element.each(function(i, el) {

				var dim = Elements.getDimensions(el);

				//start with a content-box Rect; add padding, border, margin below
				var rect = new DomRect({
					element: el,
					top: dim.offset.top,
					left: dim.offset.left,
					width: dim.width + dim.padding.left + dim.padding.right + dim.border.left + dim.border.right,
					height: dim.height + dim.padding.top + dim.padding.bottom + dim.border.top + dim.border.bottom,
					border: dim.border,
					margin: dim.margin,
					padding: dim.padding
				});

				//first iteration
				if (!bounding) {
					bounding = rect;
					return true; //continue
				}

				bounding = bounding.united(rect);

				return true;

			}.bind(this));

			this._initial = bounding._initial;

			this.top = bounding.top;
			this.right = bounding.right;
			this.bottom = bounding.bottom;
			this.left = bounding.left;

			this.border = bounding.border;
			this.margin = bounding.margin;
			this.padding = bounding.padding;

			return this;
		},


		/**
		 * @override
		 * @param {joss/geometry/DomRect} rect
		 * @return {joss/geometry/DomRect}
		 */
		intersected: function() {
			var intersected = this.inherited(arguments);

			return new DomRect({
				element: this.element(),
				top: intersected.top,
				right: intersected.right,
				bottom: intersected.bottom,
				left: intersected.left,
				border: this.border,
				margin: this.margin,
				padding: this.padding
			});
		},


		/**
		 * @override
		 * @param {joss/geometry/DomRect} rect
		 * @return {joss/geometry/DomRect}
		 */
		united: function() {
			var united = this.inherited(arguments);

			return new DomRect({
				element: this.element(),
				top: united.top,
				right: united.right,
				bottom: united.bottom,
				left: united.left,
				border: this.border,
				margin: this.margin,
				padding: this.padding
			});
		},


		/**
		 * @return {joss/geometry/DomRect}
		 */
		apply: function() {
			if (!this._element || this._element.length > 1) {
				return this;
			}
			this.applyTo(this._element);
			return this;
		},


		/**
		 * @param {Element} el
		 * @return {joss/geometry/DomRect}
		 */
		applyTo: function(el) {

			var dim = Elements.getDimensions(el);
			var curr = {
				top: dim.top,
				left: dim.left,
				width: dim.width,
				height: dim.height,
				position: dim.position
			};

			var next = {
				top: this.top,
				left: this.left,
				width: this.width(),
				height: this.height()
			};

			//DomRect is a 'border-box'. Convert to 'content-box' for CSS.
			next.width -= this._padding.left + this._padding.right;
			next.height -= this._padding.top + this._padding.bottom;
			next.width -= this._border.left + this._border.right;
			next.height -= this._border.top + this._border.bottom;

			//dimensions are all gathered. what changed?
			var changed = {
				top: Math.round(curr.top) !== Math.round(next.top),
				left: Math.round(curr.left) !== Math.round(next.left),
				width: Math.round(curr.width) !== Math.round(next.width),
				height: Math.round(curr.height) !== Math.round(next.height)
			};

			var styles = {};

			if (changed.width) {
				styles.width = Math.round(next.width);
			}
			if (changed.height) {
				styles.height = Math.round(next.height);
			}

			//adjust offsets for position: relative elements (still valid for position: absolute)
			//reads: (parent-relative offset) + (change in absolute offset)
			var adjusted = {
				top: Math.round(curr.position.top + (next.top - curr.top)),
				left: Math.round(curr.position.left + (next.left - curr.left)),
				right: Math.round(-1 * (curr.position.right + (next.left - curr.left))),
				bottom: Math.round(-1 * (curr.position.bottom + (next.top - curr.top)))
			};

			var offsetParent = el[0].offsetParent || document.body;
			if (offsetParent !== document.body) {
				adjusted.top += offsetParent.scrollTop;
				adjusted.left += offsetParent.scrollLeft;
			}

			if (changed.top) {
				if (curr.precedence.y === 'bottom') {
					styles.bottom = Math.round(adjusted.bottom);
					//if we're not depending on 'top' to set height, disable it
					if (changed.height) {
						styles.top = 'auto';
					}
				}
				else {
					styles.top = Math.round(adjusted.top);
					if (changed.height) {
						styles.bottom = 'auto';
					}
				}
			}

			if (changed.left) {
				if (curr.precedence.x === 'right') {
					styles.right = Math.round(adjusted.right);
					if (changed.width) {
						styles.left = 'auto';
					}
				}
				else {
					styles.left = Math.round(adjusted.left);
					if (changed.width) {
						styles.right = 'auto';
					}
				}
			}

			if (curr.positioning === 'static' && (changed.top || changed.left)) {
				styles.position = 'absolute';
			}

			styles.borderTop = this.border.top;
			styles.borderRight = this.border.right;
			styles.borderBottom = this.border.bottom;
			styles.borderLeft = this.border.left;
			styles.marginTop = this.margin.top;
			styles.marginRight = this.margin.right;
			styles.marginBottom = this.margin.bottom;
			styles.marginLeft = this.margin.left;
			styles.paddingTop = this.padding.top;
			styles.paddingRight = this.padding.right;
			styles.paddingBottom = this.padding.bottom;
			styles.paddingLeft = this.padding.left;

			Elements.setStyles(el[0], styles);

			return this;

		}

	});


	/**
	 * Find the 'border-box' bounding rectangle of matched elements.  Or, set
	 * the bounding rectangle of the first matched element
	 *
	 * @return {joss/geometry/DomRect}
	 */
	$.fn.rect = function(opts) {

		opts = opts || {};

		if (opts.constructor === DomRect) {
			var rect = opts;
			rect.applyTo(this.first());
			return this;
		}

		opts.element = this;
		return new DomRect(opts);

	}; //jQuery.fn.rect


	return DomRect;

});
