Elements


%hash

The returned ID is not guaranteed to be consistent between page reloads. Uses
the jQuery expando property which is set on elements when using the data()
method, something like `jQuery239847923`.  This is easy enough to code
ourselves, but piggybacking on jQuery means the 'id' is more likely to already
be set.


%getStyles

Inspired by jQuery.curstyles plugin and mostly based on jQuery 1.8.2's curCSS +
cssHooks. Performs no normalization of property names, so for example
'border-top-width' must be passed as 'borderTopWidth'.  'float' is the
exception, as the property name is browser-specific ('cssFloat' or
'styleFloat'). **Returned values**, however, are normalized cross-browser (with
most of that code coming directly from jQuery).


%setStyles

The disadvantage compared to $.css is that it doesn't perform any
normalization for properties. As with $.css, try to avoid browser repaints
when calling this method in a loop. More on that
[here](http://calendar.perfplanet.com/2009/rendering-repaint-reflow-relayout-restyle/). 

