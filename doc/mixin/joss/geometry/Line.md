Describes an infinite line in two-dimensional Euclidean space.


%constructor

*opts* may have the following properties:

* `p1`: A {joss/geometry/Point} lying on the line
* `p2`: Another {joss/geometry/Point} lying on the line

Or, to describe the line in slope-intercept form:

* `m`: The slope of the line
* `b`: The y-intercept of the line

For example:

```js
var line = new Line({
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


%p1

A {joss/geometry/Point} on the line


%p2

Another {joss/geometry/Point} on the line


%m

The slope of the line


%b

The y-intercept of the line


%translate

Moves the line `dx` along the x-axis and `dy` along the y-axis, relative to
the current position. Positive values move the line to the right and downwards.


%intersection

Calculates the {joss/geometry/Point} of intersection between this line and
`other`. Returns `undefined` if the lines are parallel.


%fromSlopeIntercept

Returns a line with the given `m` slope and `b` y-intercept.
