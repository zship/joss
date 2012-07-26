(function(window, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['jquery', 'joss/geometry/DomRect', 'jquery.curstyles'], factory);
	} else {
		// Browser globals
		factory(jQuery, joss.geometry.DomRect);
	}
})(this, function($, DomRect) {

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
			if (boxSizing == 'content-box') {
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
				top: 0,
				left: 0,
				width: $(document).width(),
				height: $(document).height(),
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
				top: st,
				left: sl,
				width: $(window).width(),
				height: $(window).height(),
				padding: false,
				margin: false,
				border: false
			});
		}

		var ret;

		//regular elements, where we can ditch jQuery for most CSS
		//calculations (speed)
		els.each(function() {

			var dim = $(this).dimensions();

			var rect = new DomRect({
				left: dim.offset.left + dim.padding.left + dim.border.left,
				top: dim.offset.top + dim.padding.top + dim.border.top,
				width: dim.width,
				height: dim.height,
				padding: opts.padding,
				margin: opts.margin,
				border: opts.border,
				offsetDeltas: {
					top: dim.position.top - dim.offset.top,
					left: dim.position.left - dim.offset.left
				}
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

		return ret;
	
	};


	/*
	 * Set this element's offset, width, and height
	 * based on the given bounding rectange
	 */
	var setRect = function(el, rect) {

		var dim = el.dimensions();

		var offset = {
			top: rect.top,
			left: rect.left
		};
		var width = rect.width();
		var height = rect.height();

		if (rect.padding) {
			width -= dim.padding.left + dim.padding.right;
			height -= dim.padding.top + dim.padding.bottom;
		}
		else {
			offset.top -= dim.padding.top;
			offset.left -= dim.padding.left;
		}

		if (rect.border) {
			width -= dim.border.left + dim.border.right;
			height -= dim.border.top + dim.border.bottom;
		}
		else {
			offset.top -= dim.border.top;
			offset.left -= dim.border.left;
		}

		if (rect.margin) {
			width -= dim.margin.left + dim.margin.right;
			height -= dim.margin.top + dim.margin.bottom;
			offset.top += dim.margin.top;
			offset.left += dim.margin.left;
		}

		width = Math.round(width);
		height = Math.round(height);

		if (dim.width !== width) {
			el.css('width', width);
		}                          
		if (dim.height !== height) {
			el.css('height', height);
		}

		if (dim.offset.top === offset.top && dim.offset.left === offset.left) {
			return;
		}

		//dim's offsets are relative to the document. when we set the css, this
		//element may have a different offset parent than the document.
		var relativeOffset = {
			top: dim.position.top + (offset.top - dim.offset.top),
			left: dim.position.left + (offset.left - dim.offset.left)
		};

		relativeOffset.top = Math.round(relativeOffset.top);
		relativeOffset.left = Math.round(relativeOffset.left);

		if (dim.offset.top !== offset.top) {
			el.css('top', relativeOffset.top);
			//if we're not depending on 'bottom' to set height, disable it
			if (dim.height !== height) {
				el.css('bottom', 'auto');
			}
		}
		if (dim.offset.left !== offset.left) {
			el.css('left', relativeOffset.left);
			//if we're not depending on 'right' to set width, disable it
			if (dim.width !== width) {
				el.css('right', 'auto');
			}
		}

	};


	$.fn.dimensions = function() {
		var names = [
			'borderTopWidth',
			'borderBottomWidth',
			'borderLeftWidth',
			'borderRightWidth',
			'marginTop',
			'marginBottom',
			'marginLeft',
			'marginRight',
			'paddingTop',
			'paddingBottom',
			'paddingLeft',
			'paddingRight'
		];

		var styles = $.curStyles(this[0], names);

		$.each(styles, function(key, val) {
			styles[key] = parseInt(val, 10) || 0;
		});

		var dim = {
			//we're doing offsets relative to the *document*
			//in order to normalize between elements with different offset
			//parents. This is notoriously tricky, so use jQuery's offset()
			//instead of the faster offsetTop and offsetLeft
			offset: this.offset(),
			border: {
				top: styles['borderTopWidth'],
				bottom: styles['borderBottomWidth'],
				left: styles['borderLeftWidth'],
				right: styles['borderRightWidth']
			},
			margin: {
				top: styles['marginTop'],
				bottom: styles['marginBottom'],
				left: styles['marginLeft'],
				right: styles['marginRight']
			},
			padding: {
				top: styles['paddingTop'],
				bottom: styles['paddingBottom'],
				left: styles['paddingLeft'],
				right: styles['paddingRight']
			}
		};

		//IE handes offsetTop and offsetLeft a bit differently, counting the
		//offsetParent's borders, so 'top' != offsetTop. calculate
		//offsetTop/offsetLeft like jQuery's position(), reusing some of the
		//info we already have for a modest performance boost
		var offset = dojo.clone(dim.offset);

		//subtract element margins
		offset.top -= dim.margin.top;
		offset.left -= dim.margin.left;
		
		//add offsetParent borders
		var offsetParent = this[0].offsetParent;
		var parentOffset = /^(?:body|html)$/i.test(offsetParent.nodeName) ? {top: 0, left: 0} : $(offsetParent).offset();
		var parentBorders = $.curStyles(offsetParent, ['borderTopWidth', 'borderLeftWidth']);
		parentOffset.top += parseInt(parentBorders['borderTopWidth'], 10) || 0;
		parentOffset.left += parseInt(parentBorders['borderLeftWidth'], 10) || 0;

		dim.position = {
			top: offset.top - parentOffset.top,
			left: offset.left - parentOffset.left
		};

		//offsetWidth and offsetHeight include borders and padding.
		//get the 'content-box' width/height
		dim.width = this[0].offsetWidth;
		dim.width -= dim.border.left + dim.border.right;
		dim.width -= dim.padding.left + dim.padding.right;

		dim.height = this[0].offsetHeight;
		dim.height -= dim.border.top + dim.border.bottom;
		dim.height -= dim.padding.top + dim.padding.bottom;

		return dim;
	
	};
	
});
