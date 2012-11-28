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
	var lang = require('dojo/_base/lang');
	var Rect = require('./Rect');
	var Elements = require('joss/util/Elements');
	var Classes = require('joss/util/Classes');
	var objectKeys = require('amd-utils/object/keys');



	var defaults = {
		element: null,
		dimensions: {},
		countsPadding: true,
		countsMargin: false,
		countsBorder: true
	};

	var getset = objectKeys(defaults).concat([
		'offsetTop',
		'offsetLeft'
	]);


	var DomRect = Classes.getset(defaults, Rect, /** @lends joss/geometry/DomRect.prototype */ {

		/**
		 * @class
		 * @constructs
		 */
		constructor: function(opts) {

			//equivalent to css3 box-sizing,
			//'border-box' is an alias for padding & border: true,
			//'content-box' is an alias for padding & border: false
			//'border-box' is the default and **defaults** reflects that
			if (opts.boxSizing && opts.boxSizing === 'content-box') {
				opts.countsPadding = false;
				opts.countsMargin = false;
				opts.countsBorder = false;
			}

			Classes.applyOptions(this, defaults, opts);

			//no dimensions were passed: calculate from DOM
			if (this._dimensions.length === 0) {
				this._calculateDimensions();
			}

		},


		/**
		 * @param {Element} [el]
		 * @return {joss/geometry/DomRect|Element}
		 */
		element: function() {},


		_setElement: function(el) {
			this._element = Elements.toJquery(el);
			return this;
		},


		/**
		 * Immutable DOM dimensions object
		 * @param {Object} [dim]
		 * @return {joss/geometry/DomRect|Object}
		 */
		dimensions: function() {},


		//inspect dimensions of this._element from the DOM
		_calculateDimensions: function() {
			//some special cases:
			//entire document
			if (this._element[0] === document) {
				var docWidth = $(document).width();
				var docHeight = $(document).height();
				this.top = 0;
				this.left = 0;
				this.width(docWidth);
				this.height(docHeight);
				this.dimensions(
					lang.mixin(Elements.defaultDimensions, {
						width: docWidth,
						height: docHeight
					})
				);
				this.countsPadding(false);
				this.countsMargin(false);
				this.countsBorder(false);

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
				this.dimensions(
					lang.mixin(Elements.defaultDimensions, {
						width: winWidth,
						height: winHeight
					})
				);
				this.countsPadding(false);
				this.countsMargin(false);
				this.countsBorder(false);

				return this;
			}

			var bounding;
			var boundingDimensions = lang.clone(Elements.defaultDimensions);
			var self = this;

			//regular elements, where we can ditch jQuery for most CSS
			//calculations (speed)
			this._element.each(function(i, el) {

				var dim = Elements.getDimensions(el);

				//start with a content-box Rect; add padding, border, margin below
				var rect = new Rect({
					l: dim.offset.left + dim.padding.left + dim.border.left,
					t: dim.offset.top + dim.padding.top + dim.border.top,
					w: dim.width,
					h: dim.height
				});

				if (self.countsPadding()) {
					rect.left -= dim.padding.left;
					rect.top -= dim.padding.top;
					rect.right += dim.padding.right;
					rect.bottom += dim.padding.bottom;
				}

				if (self.countsBorder()) {
					rect.left -= dim.border.left;
					rect.top -= dim.border.top;
					rect.right += dim.border.right;
					rect.bottom += dim.border.bottom;
				}

				if (self.countsMargin()) {
					rect.left -= dim.margin.left;
					rect.top -= dim.margin.top;
					rect.right += dim.margin.right;
					rect.bottom += dim.margin.bottom;
				}

				//first iteration
				if (!bounding) {
					bounding = rect;
					boundingDimensions = dim;
					return true; //continue
				}

				bounding = bounding.united(rect);

				boundingDimensions = {
					offset: {
						top: Math.min(dim.offset.top, boundingDimensions.offset.top),
						left: Math.min(dim.offset.left, boundingDimensions.offset.left)
					},
					position: {
						top: Math.min(dim.position.top, boundingDimensions.position.top),
						bottom: Math.max(dim.position.bottom, boundingDimensions.position.bottom),
						left: Math.min(dim.position.left, boundingDimensions.position.left),
						right: Math.max(dim.position.right, boundingDimensions.position.right)
					},
					border: {
						top: Math.min(dim.border.top, boundingDimensions.border.top),
						bottom: Math.max(dim.border.bottom, boundingDimensions.border.bottom),
						left: Math.min(dim.border.left, boundingDimensions.border.left),
						right: Math.max(dim.border.right, boundingDimensions.border.right)
					},
					margin: {
						top: Math.min(dim.margin.top, boundingDimensions.margin.top),
						bottom: Math.max(dim.margin.bottom, boundingDimensions.margin.bottom),
						left: Math.min(dim.margin.left, boundingDimensions.margin.left),
						right: Math.max(dim.margin.right, boundingDimensions.margin.right)
					},
					padding: {
						top: Math.min(dim.padding.top, boundingDimensions.padding.top),
						bottom: Math.max(dim.padding.bottom, boundingDimensions.padding.bottom),
						left: Math.min(dim.padding.left, boundingDimensions.padding.left),
						right: Math.max(dim.padding.right, boundingDimensions.padding.right)
					}
				};

				return true;
			
			});

			this.top = bounding.top;
			this.right = bounding.right;
			this.bottom = bounding.bottom;
			this.left = bounding.left;
			this.dimensions(boundingDimensions);

			return this;
		},


		/**
		 * @override
		 * @param {Number} dx
		 * @param {Number} dy
		 * @return {joss/geometry/DomRect}
		 */
		translate: function(dx, dy) {
			this._dimensions.offset.left += dx;
			this._dimensions.offset.top += dy;
			return this;
		},


		/**
		 * @override
		 * @param {joss/geometry/DomRect} other
		 * @return {joss/geometry/DomRect}
		 */
		united: function(other) {
			var united = this.inherited(arguments);

			if (this.countsPadding() !== other.countsPadding) {
				rect.left -= dim.padding.left;
				rect.top -= dim.padding.top;
				rect.right += dim.padding.right;
				rect.bottom += dim.padding.bottom;
			}

			if (this.countsBorder() !== other.countsBorder) {
				rect.left -= dim.border.left;
				rect.top -= dim.border.top;
				rect.right += dim.border.right;
				rect.bottom += dim.border.bottom;
			}

			if (self.countsMargin()) {
				rect.left -= dim.margin.left;
				rect.top -= dim.margin.top;
				rect.right += dim.margin.right;
				rect.bottom += dim.margin.bottom;
			}

			var dim = {
				offset: {
					top: Math.min(other.dimensions().offset.top, this.dimensions().offset.top),
					left: Math.min(other.dimensions().offset.left, this.dimensions().offset.left)
				},
				position: {
					top: Math.min(other.dimensions().position.top, this.dimensions().position.top),
					bottom: Math.max(other.dimensions().position.bottom, this.dimensions().position.bottom),
					left: Math.min(other.dimensions().position.left, this.dimensions().position.left),
					right: Math.max(other.dimensions().position.right, this.dimensions().position.right)
				},
				border: {
					top: Math.min(other.dimensions().border.top, this.dimensions().border.top),
					bottom: Math.max(other.dimensions().border.bottom, this.dimensions().border.bottom),
					left: Math.min(other.dimensions().border.left, this.dimensions().border.left),
					right: Math.max(other.dimensions().border.right, this.dimensions().border.right)
				},
				margin: {
					top: Math.min(other.dimensions().margin.top, this.dimensions().margin.top),
					bottom: Math.max(other.dimensions().margin.bottom, this.dimensions().margin.bottom),
					left: Math.min(other.dimensions().margin.left, this.dimensions().margin.left),
					right: Math.max(other.dimensions().margin.right, this.dimensions().margin.right)
				},
				padding: {
					top: Math.min(other.dimensions().padding.top, this.dimensions().padding.top),
					bottom: Math.max(other.dimensions().padding.bottom, this.dimensions().padding.bottom),
					left: Math.min(other.dimensions().padding.left, this.dimensions().padding.left),
					right: Math.max(other.dimensions().padding.right, this.dimensions().padding.right)
				},
				width: united.width(),
				height: united.height()
			};

			return new DomRect({
				element: this.element(),
				dimensions: dim,
				countsPadding: this.countsPadding(),
				countsMargin: this.countsMargin(),
				countsBorder: this.countsBorder(),
				top: dim.offset.top,
				left: dim.offset.left,
				r: Math.max(self.right, other.right),
				b: Math.max(self.bottom, other.bottom)
			});

		},


		/**
		 * @return {joss/geometry/DomRect}
		 */
		apply: function() {
			if (!this._element || this._element.length > 1) {
				return this;
			}
			setRect(this._element, this);
			return this;
		}
		
	});


	/**
	 * Find the bounding rectangle of matched elements,
	 * by default including padding and border (border-box)
	 * Or, set the bounding rectangle of the first matched
	 * element
	 *
	 * @return {joss/geometry/DomRect}
	 */
	$.fn.rect = function(opts) {

		opts = opts || {};

		if (opts.constructor === DomRect) {
			var rect = opts;
			setRect(this.first(), rect);
			return this;
		}

		if (opts.constructor === String) {
			opts = {
				boxSizing: opts
			};
		}

		opts.element = this;

		return new DomRect(opts);

	}; //jQuery.fn.rect


	/*
	 * Set this element's offset, width, and height
	 * based on the given bounding rectange
	 */
	var setRect = function(el, rect) {

		var curr = rect.dimensions();
		var next = {
			offset: {
				top: rect.top,
				left: rect.left
			},
			width: rect.width(),
			height: rect.height()
		};

		//calculate next values (the ones to set)
		if (rect.countsPadding) {
			next.width -= curr.padding.left + curr.padding.right;
			next.height -= curr.padding.top + curr.padding.bottom;
		}
		else {
			next.offset.top -= curr.padding.top;
			next.offset.left -= curr.padding.left;
		}

		if (rect.countsBorder) {
			next.width -= curr.border.left + curr.border.right;
			next.height -= curr.border.top + curr.border.bottom;
		}
		else {
			next.offset.top -= curr.border.top;
			next.offset.left -= curr.border.left;
		}

		if (rect.countsMargin) {
			next.width -= curr.margin.left + curr.margin.right;
			next.height -= curr.margin.top + curr.margin.bottom;
			next.offset.top += curr.margin.top;
			next.offset.left += curr.margin.left;
		}

		//dimensions are all gathered. what changed?
		var changed = {
			top: Math.round(curr.offset.top) !== Math.round(next.offset.top),
			left: Math.round(curr.offset.left) !== Math.round(next.offset.left),
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
			top: Math.round(curr.position.top + (next.offset.top - curr.offset.top)),
			left: Math.round(curr.position.left + (next.offset.left - curr.offset.left)),
			right: Math.round(-1 * (curr.position.right + (next.offset.left - curr.offset.left))),
			bottom: Math.round(-1 * (curr.position.bottom + (next.offset.top - curr.offset.top)))
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

		Elements.setStyles(el[0], styles);

		return new DomRect({
			el: el,
			countsPadding: rect.padding,
			countsBorder: rect.border,
			countsMargin: rect.margin,
			dimensions: lang.mixin(curr, {
				offset: {
					top: next.offset.top,
					left: next.offset.left
				},
				position: {
					top: adjusted.top,
					left: adjusted.left,
					right: adjusted.right,
					bottom: adjusted.bottom
				},
				width: styles.width,
				height: styles.height
			}),
			top: next.offset.top,
			left: next.offset.left,
			width: next.width,
			height: next.height
		});

	};


	return DomRect;

});
