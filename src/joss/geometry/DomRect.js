define(function(require) {

	var $ = require('jquery');
	var Classes = require('joss/util/Classes');
	var lang = require('dojo/_base/lang');
	var merge = require('amd-utils/object/merge');
	var Rect = require('./Rect');
	var Elements = require('joss/util/Elements');



	//Rect subclass which can track border, padding, and margin on a DOM
	//Element, as well as read/write its dimensions from/to an Element
	var DomRect = Classes.create(Rect, /** @lends joss/geometry/DomRect.prototype */ {

		'-accessors-': ['border', 'padding'],

		/**
		 * @class
		 * @constructs
		 */
		constructor: function(opts) {

			//if no positioning info was passed, calculate from the DOM (below)
			if (!(opts.top || opts.left || opts.right || opts.bottom)) {
				var rect = DomRect.fromElement(opts.element);
				this.top = rect.top;
				this.right = rect.right;
				this.bottom = rect.bottom;
				this.left = rect.left;
				opts = {
					element: rect.element,
					border: rect.border,
					padding: rect.padding,
					margin: rect.margin
				};
			}

			this.element = opts.element;
			this._border = merge({top: 0, right: 0, bottom: 0, left: 0}, opts.border);
			this._padding = merge({top: 0, right: 0, bottom: 0, left: 0}, opts.padding);
			this._margin = opts.margin;

		},


		_setElements: function(el) {
			el = Elements.toJquery(el);
			this._element = el[0];
			this._$element = el;
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


		/** @type {Object} */
		border: null,


		'set border.top': function(val, prev) {
			this.height -= prev;
			this.height += val;
			this._border._top = val;
		},


		'set border.right': function(val, prev) {
			this.width -= prev;
			this.width += val;
			this._border._right = val;
		},


		'set border.bottom': function(val, prev) {
			this.height -= prev;
			this.height += val;
			this._border._bottom = val;
		},


		'set border.left': function(val, prev) {
			this.width -= prev;
			this.width += val;
			this._border._left = val;
		},


		/** @type {Object} */
		margin: null,


		'set margin': function(val) {
			this._margin = lang.mixin(this._margin, val);
		},


		/** @type {Object} */
		padding: null,


		'set padding.top': function(val, prev) {
			this.height -= prev;
			this.height += val;
			this._padding._top = val;
		},


		'set padding.right': function(val, prev) {
			this.width -= prev;
			this.width += val;
			this._padding._right = val;
		},


		'set padding.bottom': function(val, prev) {
			this.height -= prev;
			this.height += val;
			this._padding._bottom = val;
		},


		'set padding.left': function(val, prev) {
			this.width -= prev;
			this.width += val;
			this._padding._left = val;
		},


		/**
		 * @override
		 * @param {joss/geometry/DomRect} rect
		 * @return {joss/geometry/DomRect}
		 */
		intersected: function() {
			var intersected = this.inherited(arguments);

			return new DomRect({
				element: this.element,
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
				element: this.element,
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
			if (!this.element || this.$element.length > 1) {
				return this;
			}
			this.applyTo(this.element);
			return this;
		},


		/**
		 * @param {Element|String|jQuery} el
		 * @return {joss/geometry/DomRect}
		 */
		applyTo: function(el) {

			el = Elements.fromAny(el);

			var dim = Elements.getDimensions(el);
			var curr = {
				top: dim.offset.top,
				left: dim.offset.left,
				width: dim.width,
				height: dim.height,
				precedence: dim.precedence,
				position: dim.position
			};

			var next = {
				top: this.top,
				left: this.left,
				width: this.width,
				height: this.height
			};

			//DomRect is a 'border-box'. Convert to 'content-box' for CSS.
			next.width -= this.padding.left + this.padding.right;
			next.height -= this.padding.top + this.padding.bottom;
			next.width -= this.border.left + this.border.right;
			next.height -= this.border.top + this.border.bottom;

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

			var offsetParent = el.offsetParent || document.body;
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

			styles.borderTopWidth = this.border.top;
			styles.borderRightWidth = this.border.right;
			styles.borderBottomWidth = this.border.bottom;
			styles.borderLeftWidth = this.border.left;
			styles.paddingTop = this.padding.top;
			styles.paddingRight = this.padding.right;
			styles.paddingBottom = this.padding.bottom;
			styles.paddingLeft = this.padding.left;
			styles.marginTop = this.margin.top;
			styles.marginRight = this.margin.right;
			styles.marginBottom = this.margin.bottom;
			styles.marginLeft = this.margin.left;

			Elements.setStyles(el, styles);

			return this;

		}

	});


	DomRect.fromElement = function(el) {

		el = Elements.toJquery(el);
		var dim = Elements.defaultDimensions();

		//some special cases:
		//entire document
		if (el[0] === document) {
			var docWidth = $(document).width();
			var docHeight = $(document).height();

			return new DomRect({
				top: 0,
				left: 0,
				width: docWidth,
				height: docHeight,
				border: dim.border,
				margin: dim.margin,
				padding: dim.padding
			});
		}

		//viewport, with scrolling
		if (el[0] === window) {
			var winWidth = $(window).width();
			var winHeight = $(window).height();
			var st = parseInt($(window).scrollTop(), 10);
			var sl = parseInt($(window).scrollLeft(), 10);

			return new DomRect({
				top: st,
				left: sl,
				width: winWidth,
				height: winHeight,
				border: dim.border,
				margin: dim.margin,
				padding: dim.padding
			});
		}

		var bounding;

		//regular elements, where we can ditch jQuery for most CSS
		//calculations (speed)
		el.each(function(i, el) {

			var dim = Elements.getDimensions(el);

			var rect = new DomRect({
				element: el,
				top: dim.offset.top,
				left: dim.offset.left,
				width: dim.width + dim.border.left + dim.border.right + dim.padding.left + dim.padding.right,
				height: dim.height + dim.border.top + dim.border.bottom + dim.padding.top + dim.padding.bottom,
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

		return bounding;

	};


	/**
	 * Find the 'border-box' bounding rectangle of matched elements.  Or, set
	 * the bounding rectangle of the first matched element
	 *
	 * @return {joss/geometry/DomRect}
	 */
	$.fn.rect = function(opts) {

		opts = opts || {};

		if (opts.constructor === DomRect) {
			opts.applyTo(this.first());
			return this;
		}

		opts.element = this;
		return new DomRect(opts);

	}; //jQuery.fn.rect


	return DomRect;

});
