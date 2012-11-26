Inspired by the Qt library's
[QRect](http://doc.qt.digia.com/4.7-snapshot/qrect.html) class.


%constructor

*opts* may have the following properties:

* `top`: y-coordinate of the top edge
* `right`: x-coordinate of the right edge
* `bottom`: y-coordinate of the bottom edge
* `left`: x-coordinate of the left edge
* `width`: the width of the rectangle
* `height`: the height of the rectangle
* `t`: alias for `top`
* `r`: alias for `right`
* `b`: alias for `bottom`
* `l`: alias for `left`
* `w`: alias for `width`
* `h`: alias for `height`

You may use any four which can logically be construed to represent a rectangle.
For example:

```js
var rect = new Rect({
	top: 0,
	left: 25,
	right: 50,
	bottom: 100
});

console.log(rect.top); //> 0
console.log(rect.left); //> 25
console.log(rect.width()); //> 25
console.log(rect.height()); //> 100

var rect2 = new Rect({
	top: 0,
	left: 0,
	width: 50,
	height: 100
});

console.log(rect2.top); //> 0
console.log(rect2.left); //> 0
console.log(rect2.width()); //> 50
console.log(rect2.height()); //> 100

var rect3 = new Rect({
	top: 0,
	right: 100,
	width: 25,
	height: 100
});

console.log(rect3.top); //> 0
console.log(rect3.left); //> 75
console.log(rect3.right); //> 100
console.log(rect3.width()); //> 25
console.log(rect3.height()); //> 100
```


%translate

Moves the rectangle dx along the x-axis and dy along the y-axis, relative to
the current position. Positive values move the rectangle to the right and
downwards.


%left
The x coordinate of the left edge of this rectangle


%top
The y coordinate of the top edge of this rectangle


%right
The x coordinate of the right edge of this rectangle


%bottom
The y coordinate of the bottom edge of this rectangle


%moveBottom

Moves the rectangle vertically, leaving the rectangle's bottom edge at the
given *y* coordinate. The rectangle's size is unchanged.


%moveBottomLeft

Moves the rectangle, leaving the bottom-left corner at the given point *p*. The
rectangle's size is unchanged.


%moveBottomRight

Moves the rectangle, leaving the bottom-right corner at the given point *p*.
The rectangle's size is unchanged.


%moveCenter

Moves the rectangle, leaving the center point at the given point *p*. The
rectangle's size is unchanged.


%moveLeft

Moves the rectangle horizontally, leaving the rectangle's left edge at the
given *x* coordinate. The rectangle's size is unchanged.


%moveRight

Moves the rectangle horizontally, leaving the rectangle's right edge at the
given *x* coordinate. The rectangle's size is unchanged.


%moveTo

Moves the rectangle, leaving the top-left corner at the given point *p*. The
rectangle's size is unchanged.


%moveTop

Moves the rectangle vertically, leaving the rectangle's top edge at the given
*y* coordinate. The rectangle's size is unchanged.


%moveTopLeft

Moves the rectangle, leaving the top-left corner at the given point *p*. The
rectangle's size is unchanged.


%moveTopRight

Moves the rectangle, leaving the top-right corner at the given point *p*. The
rectangle's size is unchanged.


%center

Returns the center point of the rectangle.


%centerOn

Moves the rectangle, leaving the center point at the given point *p*. The
rectangle's size is unchanged. An alias for {joss/geometry/Rect#moveCenter}.


%position

{joss/geometry/Rect#position} is modeled after jQuery UI's
[position](http://api.jqueryui.com/position/) utility, with a few convenience
changes in the {joss/geometry/Position} objects accepted as options. See
{joss/geometry/Position} for a discussion on these differences.

*opts* may have the following properties:

* `my`: {String} | {joss/geometry/Position} - which position **on the element
  being positioned** to align with the target element
* `at`: {String} | {joss/geometry/Position} - which position **on the target
  element** to align the positioned element against
* `of`: {joss/geometry/Rect} - the target Rect object to position against
* [`offset`: {Object}] - {{Number} x, {Number} y} amount to offset on each axis

This seems somewhat cryptic, but users of jQuery UI may recognize that it is
intended to read fluently when written out, e.g. "position my top left at
bottom right of target".

```js
var rect = new Rect({t: 0, l: 0, w: 50, h: 50});
var target = new Rect({t: 100, l: 100, w: 100, h: 100});

console.log(rect.top); //> 0
console.log(rect.bottom); //> 50
console.log(rect.left); //> 0
console.log(rect.right); //> 50

rect = rect.position({
	my: 'top right',
	at: 'top left',
	of: target
});

//rect's top edge is now aligned with the top edge of target
//rect's right edge is now directly against the left edge of target

console.log(rect.top); //> 100
console.log(rect.bottom); //> 150
console.log(rect.left); //> 50
console.log(rect.right); //> 100
```


%width

Get or set the width of this rectangle, in pixels


%height

Get or set the height of this rectangle, in pixels


%contains

Returns true if the given *target* is inside or on the edge of the rectangle;
otherwise returns false.


%topLeft

Returns the position of the rectangle's top-left corner.


%topRight

Returns the position of the rectangle's top-right corner.


%bottomLeft

Returns the position of the rectangle's bottom-left corner.


%bottomRight

Returns the position of the rectangle's bottom-right corner.


%united

Returns a new {joss/geometry/Rect} object representing the bounding rectangle
encompassing this rectangle and the given rectangle.


%intersected

Return the intersection of this rectangle and the given rectangle. Whether or
not this rectangle intersects the given rectangle can be determined using the
{joss/geometry/Rect#intersects} function.


%intersects

Returns true if this rectangle intersects with the given rectangle (i.e. there
is a non-empty area of overlap between them), otherwise returns false.  The
intersection rectangle can be retrieved using the {joss/geometry/Rect#intersected} function.


%normalized

Returns a new rectangle with a non-negative width/height.  If width < 0, swap
left and right.  Ditto for height.
