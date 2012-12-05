Elements


## hash

Assign a unique ID for a DOM Element, regardless of the presence of an id
attribute. The returned ID is not guaranteed to be consistent between page
reloads. Uses the jQuery expando property which is set on elements when using
the data() method, something like `jQuery239847923`.  This is easy enough to
code ourselves, but piggybacking on jQuery means the 'id' is more likely to
already be set.


## getDimensions

Performant way to accurately get all dimensions of a DOM element. The returned
{Object} has the following properties:

```js
{
	// CSS position property
	positioning: 'static',
	//which offset values were explicitly specified (i.e. not 'auto')
	precedence: {
		x: 'left',
		y: 'top'
	},
	//offset relative to the document
	offset: {
		top: 0,
		left: 0
	},
	//offset relative to the offsetParent
	position: {
		top: 0,
		right: 0,
		bottom: 0,
		left: 0
	},
	//'content-box' width (without borders/padding)
	width: 0,
	//'content-box' height (without borders/padding)
	height: 0,
	//'border-width' values
	border: {
		top: 0,
		right: 0,
		bottom: 0,
		left: 0
	},
	//'margin' values
	margin: {
		top: 0,
		right: 0,
		bottom: 0,
		left: 0
	},
	//'padding' values
	padding: {
		top: 0,
		right: 0,
		bottom: 0,
		left: 0
	}
}
```


## getStyles

Performant way to get multiple CSS styles all at once. Inspired by
jQuery.curstyles plugin and mostly based on jQuery 1.8.2's curCSS + cssHooks.
Performs no normalization of property names, so for example `border-top-width`
must be passed as `borderTopWidth`.  `float` is the exception, as the property
name is browser-specific ('cssFloat' or 'styleFloat'). **Returned values**,
however, are normalized cross-browser (with most of that code coming directly
from jQuery).


## setStyles

Performant way to set multiple CSS styles all at once. The disadvantage
compared to $.css is that it doesn't perform any normalization for properties.
As with $.css, try to avoid browser repaints when calling this method in a
loop. More on that
[here](http://calendar.perfplanet.com/2009/rendering-repaint-reflow-relayout-restyle/).
