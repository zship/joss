/*
 * Static utility methods dealing with DOM Elements
 */
define(function(require) {

	var $ = require('jquery');
	var Point = require('joss/geometry/Point');


	var scrollIsRelative = !($.browser.opera || $.browser.safari && $.browser.version < "532");

	// Used for matching numbers
	var rNumber = /[\-+]?(?:\d*\.|)\d+(?:[eE][\-+]?\d+|)/.source;
	// Number not ending in 'px'
	var rNonPixelNumber = new RegExp( "^(" + rNumber + ")(?!px)[a-z%]+$", "i" );

	var cssPxLength = {
		"fillOpacity": true,
		"fontWeight": true,
		"lineHeight": true,
		"opacity": true,
		"orphans": true,
		"widows": true,
		"zIndex": true,
		"zoom": true
	};



	var Elements = {

		/**
		 * Return a unique ID for a DOM Element,
		 * regardless of the presence of an id attribute.
		 * Uses the jQuery expando property which is set on elements when using
		 * the data() method, something like jQuery239847923 = ID.
		 * This is easy enough to code ourselves, but piggybacking on jQuery
		 * means the 'id' is more likely to already be set.
		 *
		 * @param {HTMLElement} el
		 */
		hash: function(el) {

			var ex = $.expando;
			if (el[ex]) {
				return el[ex];
			}

			//no expando property? set one by setting arbitrary data
			$(el).data('joss-hash-gen', '');
			return el[ex];
		
		},


		/**
		 * Returns a DOM element lying at a point
		 *
		 * @param {Point} p
		 */
		fromPoint: function(x, y) {

			if(!document.elementFromPoint) {
				return null;
			}

			var p;

			if (x.constructor === Point) {
				p = x;
			}
			else {
				p = new Point(x, y);
			}

			if(scrollIsRelative)
			{
				p.x -= $(document).scrollLeft();
				p.y -= $(document).scrollTop();
			}

			return document.elementFromPoint(p.x, p.y);
		
		},


		/**
		 * Performant way to get multiple CSS styles all at once, inspired by
		 * jQuery.curstyles plugin and mostly based on jQuery 1.8.2's curCSS +
		 * cssHooks. Performs no normalization of property names, so for
		 * example 'border-top-width' must be passed as 'borderTopWidth'.
		 * 'float' is the exception, as the property name is browser-specific
		 * ('cssFloat' or 'styleFloat'). **Returned values**, however, are normalized
		 * cross-browser (with most of that code coming directly from jQuery).
		 *
		 * @param {HTMLElement} el
		 * @param {Array} styles : Style names
		 * @return {Object} : Map of style name -> CSS 'used' value
		 */
		getStyles: function(el, styles) {

			if (!el) {
				return null;
			}

			for (var i = 0; i < styles.length; i++ ) {
				if (styles[i] === 'float') {
					styles[i] = $.support.cssFloat ? 'cssFloat' : 'styleFloat';
				}
			}

			if (window.getComputedStyle) {
				return this._getStylesUsingComputedStyle(el, styles);
			}

			return this._getStylesUsingCurrentStyle(el, styles);

		},


		// modern browsers
		_getStylesUsingComputedStyle: function(el, styles) {

			var results = {};
			var computed = window.getComputedStyle(el, null);

			for (var i = 0; i < styles.length; i++) {
				var name = styles[i];
				var val = computed[name];

				// We should always get a number back from opacity
				if (name === 'opacity' && val === '') {
					val = '1';
				}

				// Webkit bug: https://bugs.webkit.org/show_bug.cgi?id=29084
				// getComputedStyle returns percent when specified for top/left/bottom/right
				// rather than make the css module depend on the offset module, we just check for it here
				if ( /^(top|left)$/.test(name) && rNonPixelNumber.test( val ) ) {
					val = $(el).position()[name];
				}

				// A tribute to the 'awesome hack by Dean Edwards'
				// Chrome < 17 and Safari 5.0 uses 'computed value' instead of 'used value' for margin-right
				// Safari 5.1.7 (at least) returns percentage for a larger set of values, but width seems to be reliably pixels
				// this is against the CSSOM draft spec: http://dev.w3.org/csswg/cssom/#resolved-values
				if ( /^margin/.test(name) && rNonPixelNumber.test( val ) ) {
					var width = el.style.width;
					var minWidth = el.style.minWidth;
					var maxWidth = el.style.maxWidth;

					el.style.minWidth = el.style.maxWidth = el.style.width = val;
					val = computed.width;

					el.style.width = width;
					el.style.minWidth = minWidth;
					el.style.maxWidth = maxWidth;
				}

				results[name] = val;
			}

			return results;

		},


		// IE < 9
		_getStylesUsingCurrentStyle: function(el, styles) {

			var results = {};
			var styleObject = el.currentStyle;

			for (var i = 0; i < styles.length; i++) {
				var name = styles[i];
				var val = styleObject[name];

				if (val === null && el.style && el.style[name] ) {
					val = el.style[name];
				}

				// From the awesome hack by Dean Edwards
				// http://erik.eae.net/archives/2007/07/27/18.54.15/#comment-102291

				// If we're not dealing with a regular pixel number
				// but a number that has a weird ending, we need to convert it to pixels
				// but not position css attributes, as those are proportional to the parent element instead
				// and we can't measure the parent instead because it might trigger a 'stacking dolls' problem
				if ( rNonPixelNumber.test(val) && !/^(top|right|bottom|left)$/.test(name) ) {

					// Remember the original values
					var left = el.style.left;
					var rsLeft = el.runtimeStyle && el.runtimeStyle.left;

					// Put in the new values to get a computed value out
					if ( rsLeft ) {
						el.runtimeStyle.left = el.currentStyle.left;
					}
					el.style.left = (name === 'fontSize') ? '1em' : val;
					val = el.style.pixelLeft + 'px';

					// Revert the changed values
					el.style.left = left;
					if ( rsLeft ) {
						el.runtimeStyle.left = rsLeft;
					}
				}

				results[name] = (val === '') ? 'auto' : val;
			}

			return results;

		},


		/**
		 * Performant way to set multiple CSS styles all at once. The
		 * disadvantage compared to $.css is that it doesn't perform
		 * any normalization for properties. As with $.css, try to avoid browser
		 * repaints when calling this method in a loop. More on that here:
		 * http://calendar.perfplanet.com/2009/rendering-repaint-reflow-relayout-restyle/
		 *
		 * @param {HTMLElement} el
		 * @param {Object} styles : Map of style names to style values
		 */
		setStyles: function(el, styles) {

			$.each(styles, function(name, val) {
				var type = typeof val;

				if ( val === null || type === "number" && isNaN(val) ) {
					return;
				}

				if (type === 'number' && !cssPxLength[name]) {
					val += "px";
				}

				el.style[name] = val;
			});

		},


		/**
		 * Performant way to get all dimensions of a DOM element
		 *
		 * @param {HTMLElement} el
		 */
		getDimensions: function(el) {

			var names = [
				'position',
				'top',
				'bottom',
				'left',
				'right',
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

			var styles = Elements.getStyles(el, names);

			$.each(styles, function(key, val) {
				if ([
					'position',
					'top',
					'bottom',
					'left',
					'right'
					].indexOf(key) !== -1
				) {
					styles[key] = val;
					return true; //continue
				}
				styles[key] = parseInt(val, 10) || 0;
			});

			var dim = {
				positioning: styles['position'],
				precedence: {
					x: (styles['right'] === 'auto') ? 'left' : 'right',
					y: (styles['bottom'] === 'auto') ? 'top' : 'bottom'
				},
				//we're doing offsets relative to the *document*
				//in order to normalize between elements with different offset
				//parents. This is notoriously tricky, so use jQuery's offset()
				//instead of the faster offsetTop and offsetLeft
				offset: $(el).offset(),
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
			var offset = {
				top: dim.offset.top,
				left: dim.offset.left
			};

			//subtract element margins
			offset.top -= dim.margin.top;
			offset.left -= dim.margin.left;

			//var offsetParent = $(el).offsetParent()[0];
			var offsetParent = el.offsetParent || document.body;
			var parentStyles = Elements.getStyles(offsetParent, ['borderTopWidth', 'borderBottomWidth', 'borderLeftWidth', 'borderRightWidth']);
			
			var parent = {
				element: offsetParent,
				offset: /^(?:body|html)$/i.test(offsetParent.nodeName) ? {top: 0, left: 0} : $(offsetParent).offset(),
				width: offsetParent.offsetWidth,
				height: offsetParent.offsetHeight,
				border: {
					top: parseInt(parentStyles['borderTopWidth'], 10) || 0,
					bottom: parseInt(parentStyles['borderBottomWidth'], 10) || 0,
					left: parseInt(parentStyles['borderLeftWidth'], 10) || 0,
					right: parseInt(parentStyles['borderRightWidth'], 10) || 0
				}
			};

			dim.position = {
				top: offset.top - (parent.offset.top + parent.border.top),
				left: offset.left - (parent.offset.left + parent.border.left),
				right: (offset.left + el.offsetWidth) - (parent.offset.left + parent.width),
				bottom: (offset.top + el.offsetHeight) - (parent.offset.top + parent.height)
			};

			//offsetWidth and offsetHeight include borders and padding.
			//get the 'content-box' width/height
			dim.width = el.offsetWidth;
			dim.width -= dim.border.left + dim.border.right;
			dim.width -= dim.padding.left + dim.padding.right;

			dim.height = el.offsetHeight;
			dim.height -= dim.border.top + dim.border.bottom;
			dim.height -= dim.padding.top + dim.padding.bottom;

			return dim;

		}

	};


	//jQuery plugin versions of above methods
	$.fn.hash = function() {
		return Elements.hash(this[0]);
	};

	$.fn.dimensions = function() {
		return Elements.getDimensions(this[0]);
	};


	return Elements;

});
