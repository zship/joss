define(function(require) {

	var $ = require('jquery');
	var lang = require('dojo/_base/lang');
	var Point = require('joss/geometry/Point');
	var forOwn = require('amd-utils/object/forOwn');
	var isString = require('amd-utils/lang/isString');
	var isNumber = require('amd-utils/lang/isNumber');
	var isElement = require('joss/util/lang/isElement');


	/**
	 * @namespace
	 * @alias joss/util/Elements
	 */
	var Elements = {};


	/**
	 * Return a unique ID for a DOM Element, regardless of the presence of an
	 * id attribute.
	 *
	 * @param {Element|jQuery|String} el
	 * @return {Number}
	 */
	Elements.hash = function(el) {

		el = Elements.fromAny(el);

		var ex = $.expando;
		if (el[ex]) {
			return el[ex];
		}

		//no expando property? set one by setting arbitrary data
		$(el).data('joss-hash-gen', '');
		return el[ex];
	
	};


	/**
	 * Declare an Element to be replacing an existing Element, and should be
	 * considered identical to the Element it replaces.
	 *
	 * @param {Number|Element|jQuery|String} hash
	 * @param {Element|jQuery|String} el
	 */
	Elements.transferHash = function(hash, el) {

		el = Elements.fromAny(el);
		
		if (!isNumber(hash)) {
			var from = Elements.fromAny(hash);
			hash = Elements.hash(from);
		}

		var ex = $.expando;
		el[ex] = hash;

	};


	var _scrollIsRelative = !($.browser.opera || $.browser.safari && $.browser.version < "532");


	/**
	 * Returns a DOM element lying at a point
	 *
	 * @param {joss/geometry/Point} p
	 * @return {Element}
	 */
	Elements.fromPoint = function(x, y) {

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

		if(_scrollIsRelative)
		{
			p.x -= $(document).scrollLeft();
			p.y -= $(document).scrollTop();
		}

		return document.elementFromPoint(p.x, p.y);
	
	};


	/**
	 * Create a jQuery element from **el**. Avoids calling jQuery if **el** is
	 * already a jQuery object.
	 * @param {Element|jQuery|String|Array<Element>} el
	 * @return {jQuery}
	 */
	Elements.toJquery = function(el) {
		if (el instanceof $) {
			return el;
		}
		return $(el);
	};


	/**
	 * Coerce a *single* DOM Element out of a string or jQuery element
	 * @param {Element|String|jQuery} el
	 * @return {Element}
	 */
	Elements.fromAny = function(el) {
		if (isElement(el)) {
			return el;
		}
		else if (el instanceof $) {
			return el[0];
		}
		else if (isString(el)) {
			return $(el)[0];
		}
	};


	/**
	 * Performant way to get multiple CSS styles all at once. 
	 *
	 * @param {Element} el
	 * @param {Array} styles : Style names
	 * @return {Object} : Map of style name -> CSS 'used' value
	 */
	Elements.getStyles = function(el, styles) {

		if (!el) {
			return null;
		}

		for (var i = 0; i < styles.length; i++ ) {
			if (styles[i] === 'float') {
				styles[i] = $.support.cssFloat ? 'cssFloat' : 'styleFloat';
			}
		}

		if (window.getComputedStyle) {
			return _getStylesUsingComputedStyle(el, styles);
		}

		return _getStylesUsingCurrentStyle(el, styles);

	};


	// Used for matching numbers
	var rNumber = /[\-+]?(?:\d*\.|)\d+(?:[eE][\-+]?\d+|)/.source;
	// Number not ending in 'px'
	var rNonPixelLengthValue = new RegExp( "^(" + rNumber + ")(?!px)[a-z%]+$", "i" );

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


	// modern browsers
	var _getStylesUsingComputedStyle = function(el, styles) {

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
			if ( /^(top|left)$/.test(name) && rNonPixelLengthValue.test( val ) ) {
				val = $(el).position()[name];
			}

			// A tribute to the 'awesome hack by Dean Edwards'
			// Chrome < 17 and Safari 5.0 uses 'computed value' instead of 'used value' for margin-right
			// Safari 5.1.7 (at least) returns percentage for a larger set of values, but width seems to be reliably pixels
			// this is against the CSSOM draft spec: http://dev.w3.org/csswg/cssom/#resolved-values
			if ( /^margin/.test(name) && rNonPixelLengthValue.test( val ) ) {
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

	};


	// IE < 9
	var _getStylesUsingCurrentStyle = function(el, styles) {

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
			if ( rNonPixelLengthValue.test(val) && !/^(top|right|bottom|left)$/.test(name) ) {

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

	};


	/**
	 * Performant way to set multiple CSS styles all at once.
	 *
	 * @param {Element} el
	 * @param {Object} styles : Map of style names to style values
	 */
	Elements.setStyles = function(el, styles) {

		forOwn(styles, function(val, name) {
			var type = typeof val;

			if ( val === null || type === "number" && isNaN(val) ) {
				return;
			}

			if (type === 'number' && !cssPxLength[name]) {
				val += "px";
			}

			el.style[name] = val;
		});

	};


	/**
	 * Performant way to accurately get all dimensions of a DOM element.
	 *
	 * @param {Element} el
	 * @return {Object}
	 */
	Elements.getDimensions = function(el) {

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
				x: (styles['left'] !== 'auto' || styles['right'] === 'auto') ? 'left' : 'right',
				y: (styles['top'] !== 'auto' || styles['bottom'] === 'auto') ? 'top' : 'bottom'
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

	};


	/**
	 * Blank dimensions object, suitable for a deep-mixin/extend operation
	 * @type {Object}
	 */
	Elements.defaultDimensions = function() {
		return lang.clone({
			positioning: 'static',
			precedence: {
				x: 'left',
				y: 'top'
			},
			offset: {
				top: 0,
				left: 0
			},
			position: {
				top: 0,
				right: 0,
				bottom: 0,
				left: 0
			},
			width: 0,
			height: 0,
			border: {
				top: 0,
				right: 0,
				bottom: 0,
				left: 0
			},
			margin: {
				top: 0,
				right: 0,
				bottom: 0,
				left: 0
			},
			padding: {
				top: 0,
				right: 0,
				bottom: 0,
				left: 0
			}
		});
	};


	/**
	 * Shortcut for {joss/util/Elements.hash}
	 * @return {Number}
	 */
	$.fn.hash = function() {
		return Elements.hash(this);
	};


	/**
	 * Shortcut for {joss/util/Elements.getDimensions}
	 * @return {Object}
	 */
	$.fn.dimensions = function() {
		return Elements.getDimensions(this[0]);
	};


	return Elements;

});
