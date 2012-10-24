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
	var declare = require('dojo/_base/declare');
	var lang = require('dojo/_base/lang');
	var Rect = require('./Rect');
	var Elements = require('joss/util/Elements');



	var DomRect = declare(Rect, {

		constructor: function(opts) {
			opts = lang.mixin({
				el: null,
				padding: true,
				margin: false,
				border: true
			}, opts);

			this._element = opts.el;
			this.padding = opts.padding;
			this.margin = opts.margin;
			this.border = opts.border;

			return this;
		},


		apply: function() {
			if (!this._element || this._element.length > 1) {
				return this;
			}
			setRect(this._element, this);
			return this;
		}
		
	});


	/*
	 $.fn.rect

	 Find the bounding rectangle of matched elements,
	 by default including padding and border (border-box)

	 Or, set the bounding rectangle of the first matched
	 element

	 @return {joss.Rect}
	 */
	$.fn.rect = function(opts) {

		opts = opts || {};

		if (opts.constructor === DomRect) {
			setRect(this.first(), opts);
			return this;
		}

		//equivalent to css3 box-sizing,
		//'border-box' is an alias for padding & border: true,
		//'content-box' is an alias for padding & border: false
		if (opts.constructor === String) {
			var boxSizing = opts;
			opts = {};
			if (boxSizing === 'content-box') {
				opts.padding = false;
				opts.margin = false;
				opts.border = false;
			}
			// 'border-box' is the default and the options below reflect that
		}

		opts = $.extend({
			padding: true,
			margin: false,
			border: true
		}, opts);

		return getRect(this, opts);

	}; //jQuery.fn.rect


	var getRect = function(els, opts) {
		//some special cases:
		//entire document
		if (els[0] === document) {
			return new DomRect({
				t: 0,
				l: 0,
				w: $(document).width(),
				h: $(document).height(),
				padding: false,
				margin: false,
				border: false
			});
		}

		//viewport, with scrolling
		if (els[0] === window) {
			var st = parseInt($(window).scrollTop(), 10);
			var sl = parseInt($(window).scrollLeft(), 10);

			return new DomRect({
				t: st,
				l: sl,
				w: $(window).width(),
				h: $(window).height(),
				padding: false,
				margin: false,
				border: false
			});
		}

		var ret;

		//regular elements, where we can ditch jQuery for most CSS
		//calculations (speed)
		els.each(function() {

			var dim = Elements.getDimensions(this);

			//start with a content-box DomRect; add padding, border, margin below
			var rect = new DomRect({
				l: dim.offset.left + dim.padding.left + dim.border.left,
				t: dim.offset.top + dim.padding.top + dim.border.top,
				w: dim.width,
				h: dim.height,
				padding: opts.padding,
				margin: opts.margin,
				border: opts.border
			});

			if (opts.padding) {
				rect.left -= dim.padding.left;
				rect.top -= dim.padding.top;
				rect.right += dim.padding.right;
				rect.bottom += dim.padding.bottom;
			}

			if (opts.border) {
				rect.left -= dim.border.left;
				rect.top -= dim.border.top;
				rect.right += dim.border.right;
				rect.bottom += dim.border.bottom;
			}

			if (opts.margin) {
				rect.left -= dim.margin.left;
				rect.top -= dim.margin.top;
				rect.right += dim.margin.right;
				rect.bottom += dim.margin.bottom;
			}

			if (!ret) {
				ret = rect;
				return true; //continue
			}

			ret = ret.united(rect);
			return true;
		
		});

		ret._element = els;

		return ret;
	
	};


	/*
	 * Set this element's offset, width, and height
	 * based on the given bounding rectange
	 */
	var setRect = function(el, rect) {

		var curr = Elements.getDimensions(el[0]);
		var next = {
			offset: {
				top: rect.top,
				left: rect.left
			},
			width: rect.width(),
			height: rect.height()
		};

		//calculate next values (the ones to set)
		if (rect.padding) {
			next.width -= curr.padding.left + curr.padding.right;
			next.height -= curr.padding.top + curr.padding.bottom;
		}
		else {
			next.offset.top -= curr.padding.top;
			next.offset.left -= curr.padding.left;
		}

		if (rect.border) {
			next.width -= curr.border.left + curr.border.right;
			next.height -= curr.border.top + curr.border.bottom;
		}
		else {
			next.offset.top -= curr.border.top;
			next.offset.left -= curr.border.left;
		}

		if (rect.margin) {
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
			styles['width'] = Math.round(next.width);
		}
		if (changed.height) {
			styles['height'] = Math.round(next.height);
		}

		//adjust offsets for position: relative elements (still valid for position: absolute)
		//reads: (parent-relative offset) + (change in absolute offset)
		var adjusted = {
			top: curr.position.top + (next.offset.top - curr.offset.top),
			left: curr.position.left + (next.offset.left - curr.offset.left),
			right: -1 * (curr.position.right + (next.offset.left - curr.offset.left)),
			bottom: -1 * (curr.position.bottom + (next.offset.top - curr.offset.top))
		};

		if (changed.top) {
			if (curr.precedence.y === 'bottom') {
				styles['bottom'] = Math.round(adjusted.bottom);
				//if we're not depending on 'top' to set height, disable it
				if (changed.height) {
					styles['top'] = 'auto';
				}
			}
			else {
				styles['top'] = Math.round(adjusted.top);
				if (changed.height) {
					styles['bottom'] = 'auto';
				}
			}
		}

		if (changed.left) {
			if (curr.precedence.x === 'right') {
				styles['right'] = Math.round(adjusted.right);
				if (changed.width) {
					styles['left'] = 'auto';
				}
			}
			else {
				styles['left'] = Math.round(adjusted.left);
				if (changed.width) {
					styles['right'] = 'auto';
				}
			}
		}

		if (curr.positioning === 'static' && (changed.top || changed.left)) {
			styles['position'] = 'absolute';
		}

		Elements.setStyles(el[0], styles);

	};


	return DomRect;

});