/*
 * Static utility methods dealing with DOM Elements
 */
define(function(require) {

	var $ = require('jquery');
	var lang = require('dojo/_base/lang');
	var Point = require('joss/geometry/Point');
	require('jquery.curstyles');


	var scrollIsRelative = !($.browser.opera || $.browser.safari && $.browser.version < "532");

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
		 * Performant way to get all dimensions of a DOM element
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

			var styles = $.curStyles(el, names);

			$.each(styles, function(key, val) {
				if (['position', 'top', 'bottom', 'left', 'right'].indexOf(key) !== -1) {
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
			var offset = lang.clone(dim.offset);

			//subtract element margins
			offset.top -= dim.margin.top;
			offset.left -= dim.margin.left;

			var offsetParent = $(el).offsetParent()[0];
			var parentStyles = $.curStyles(offsetParent, ['borderTopWidth', 'borderBottomWidth', 'borderLeftWidth', 'borderRightWidth']);
			
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
