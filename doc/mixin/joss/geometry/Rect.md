Inspired by the Qt library's
[QRect](http://doc.qt.digia.com/4.7-snapshot/qrect.html) class.


%constructor

**opts** may have the following properties:

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


%left
The x coordinate of the left edge of this rectangle


%top
The y coordinate of the top edge of this rectangle


%right
The x coordinate of the right edge of this rectangle


%bottom
The y coordinate of the bottom edge of this rectangle


%moveBottom

```js
example.code();
```

%position

**opts** is an Object with the following fields:
