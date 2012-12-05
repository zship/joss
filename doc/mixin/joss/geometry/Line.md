Describes an infinite line in two-dimensional Euclidean space.


## constructor

*opts* may have the following properties:

* `p1`: A {joss/geometry/Point} lying on the line
* `p2`: Another {joss/geometry/Point} lying on the line

Or, to describe the line in slope-intercept form:

* `m`: The slope of the line
* `b`: The y-intercept of the line

For example:

```js
var line = new Line({
	p1: new Point(0, 0),
	p2: new Point(1, 1)
});

console.log(line.m); //> 1
console.log(line.b); //> 0

line.translate(1, 0);

console.log(line.m); //> 1
console.log(line.b); //> 1
```


## p1

A {joss/geometry/Point} on the line


## p2

Another {joss/geometry/Point} on the line


## m

The slope of the line


## b

The y-intercept of the line


## translate

Moves the line `dx` along the x-axis and `dy` along the y-axis, relative to
the current position. Positive values move the line to the right and downwards.


## intersection

Calculates the {joss/geometry/Point} of intersection between this line and
`other`. Returns `undefined` if the lines are parallel.


## fromSlopeIntercept

Returns a line with the given `m` slope and `b` y-intercept.
