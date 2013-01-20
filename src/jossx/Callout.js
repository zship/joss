/*
 * Define a "callout", "tip", or "spike" of a typical tooltip.  This can be
 * used for other things, like creating an arrow.  For that reason, I'm being
 * exact here and defining a callout as a partial triangle whose two
 * visible sides, including stroke, precisely fill the specified width and
 * height.
 */
define(function(require) {

	var $ = require('jquery');
	var Class = require('class/Class');
	var Position = require('joss/geometry/Position');
	var Rect = require('joss/geometry/Rect');
	var Line = require('joss/geometry/Line');
	var Elements = require('joss/util/Elements');
	require('joss/geometry/DomRect');


	var Callout = Class.extend(/** @lends Callout.prototype */ {

		__defaults: {
			element: null,
			canvas: null,
			width: 0,
			height: 0,
			borderWidth: 1,
			borderColor: 'rgb(0, 0, 0)',
			fillColor: 'rgb(255, 255, 255)',
			direction: new Position('right center')
		},


		constructor: function(opts) {

			opts.element = opts.element || $('<div class="callout"></div>').appendTo('body');

			this._apply(opts);

			if (opts.width !== 0 && opts.height !== 0) {
				//var rect = opts.element.rect();
				this.$element.css('width', opts.width);
				this.$element.css('height', opts.height);
			}

		},


		destroy: function() {
			this.$element.remove();
		},


		_setElements: function(el) {
			this._data.element = Elements.fromAny(el);
			this._data.$element = $(this._data.element);
		},


		element: {
			set: function(el) {
				this._setElements(el);
			}
		},


		'$element': {
			set: function(el) {
				this._setElements(el);
			}
		},


		_setCanvas: function(el) {
			this._data.canvas = Elements.fromAny(el);
			this._data.$canvas = $(this._data.canvas);
		},


		canvas: {
			set: function(el) {
				this._setCanvas(el);
			}
		},


		'$canvas': {
			set: function(el) {
				this._setCanvas(el);
			}
		},


		width: { get: null, set: null },


		height: { get: null, set: null },


		borderWidth: { get: null, set: null },


		borderColor: { get: null, set: null },


		fillColor: { get: null, set: null },


		direction: {
			set: function(val) {
				this._data.direction = new Position(val);
			}
		},


		_coords: function() {

			var rect = new Rect({
				top: 0,
				left: 0,
				width: this.width,
				height: this.height
			});
			var pos = this.direction;
			var tip = rect.pointAt(pos);

			var tipEdge = pos.parts[0];

			//move the tip away from its edge to account for miter
			switch (tipEdge) {
				case 'top':
					tip.y += this.borderWidth / 2;
					break;
				case 'bottom':
					tip.y -= this.borderWidth / 2;
					break;
				case 'left':
					tip.x += this.borderWidth / 2;
					break;
				case 'right':
					tip.x -= this.borderWidth / 2;
					break;
			}


			//the opposite points, of course, lie at the corner points opposite
			//the tip
			var oppPos = [];
			oppPos[0] = pos.reverse();
			oppPos[1] = pos.reverse();

			switch (pos.precedence) {
				case 'x':
					oppPos[0].y = 'top';
					oppPos[1].y = 'bottom';
					break;
				case 'y':
					oppPos[0].x = 'left';
					oppPos[1].x = 'right';
					break;
			}

			var lines = [];
			lines[0] = new Line({
				p1: tip,
				p2: rect.pointAt(oppPos[0])
			});
			lines[1] = new Line({
				p1: tip,
				p2: rect.pointAt(oppPos[1])
			});

			//console.log(this._direction);

			//We have to translate these lines inward to account for stroke width.
			//This is because canvas draws strokes as a "center" stroke, as
			//opposed to "inside" or "outside", and we need to use some linear algebra
			//to ensure a line at any angle will lie precisely within the canvas.
			var self = this;
			lines.forEach(function(line, i) {
				//vertical line, which is a simple translation
				if (line.m === null) {

					if (line.p1.x === rect.right) {
						lines[i] = line.translate(-1 * self.borderWidth / 2, 0);
					}
					else {
						lines[i] = line.translate(self.borderWidth / 2, 0);
					}

				}
				//slanted lines can't be a simple translation, because the
				//closer a line gets to being parallel with its edge, the more
				//of its middle-aligned border will bleed through the adjacent
				//edge. picture a ruler on top of a piece of paper.
				//the paper's left and bottom edges are the y and x axes.  the
				//ruler's center running lengthwise is our line, and its body
				//is our stroke.  align the ruler's vertical center with the
				//left edge (y axis), with the bottom of the ruler lying a few
				//inches below the x axis.  now rotate the ruler about the
				//origin to just 1 degree.  almost all of it overlaps the x
				//axis.  a simple x translation by half the ruler's width would
				//still have the ruler being "cut off" at the y axis.  what we
				//want is to translate the ruler by half its width in a
				//direction exactly 90 degrees from its current angle.
				else {

					var d = self.borderWidth / 2;

					//console.log(oppPos[i]);

					var b2;
					// solve the distance between parallel lines formula
					// (http://en.wikipedia.org/wiki/Parallel_(geometry)#Distance_between_two_parallel_lines)
					// for b2, then we have a parallel line exactly borderWidth / 2px
					// from the the original line.
					if (
						(oppPos[i].precedence === 'x' && oppPos[i].y === 'top') 
						||
						(oppPos[i].precedence === 'y' && oppPos[i].y === 'bottom') 
					) {
						//-1 for canvas' inverted y coordinate system (remember?)
						b2 = -1 * line.b + Math.sqrt( Math.pow(d, 2) * Math.pow(line.m, 2) + Math.pow(d, 2) );
					}
					else {
						b2 = -1 * line.b - Math.sqrt( Math.pow(d, 2) * Math.pow(line.m, 2) + Math.pow(d, 2) );
					}

					//console.log(b2);
					lines[i] = new Line({m: line.m, b: b2});

				}

			});

			var oppEdge;
			if (pos.precedence === 'x') {
				oppEdge = pos.reverse().x;
			}
			else {
				oppEdge = pos.reverse().y;
			}

			//move the edge line a fair distance away from the real canvas
			//edge, to avoid rendering the line butting up against that edge
			rect.top -= 100;
			rect.left -= 100;
			rect.width += 200;
			rect.height += 200;

			var edges = {
				'top': new Line({p1: rect.topLeft, p2: rect.topRight}),
				'left': new Line({p1: rect.topLeft, p2: rect.bottomLeft}),
				'right': new Line({p1: rect.topRight, p2: rect.bottomRight}),
				'bottom': new Line({p1: rect.bottomLeft, p2: rect.bottomRight})
			};

			var coords = [];
			coords[0] = lines[0].intersection(edges[oppEdge]);
			coords[1] = lines[0].intersection(lines[1]);
			coords[2] = lines[1].intersection(edges[oppEdge]);
			return coords;
		
		},


		render: function() {

			var rect = this.$element.rect();
			this.width = rect.width;
			this.height = rect.height;

			if (!this.canvas) {
				//define dimensions before initializing excanvas
				this.canvas = $('<canvas width="' + this.width + '" height="' + this.height + '" />').appendTo(this.$element);
				this.$canvas.css('display', 'block');
				//excanvas for ie < 9
				if (window.G_vmlCanvasManager) {
					window.G_vmlCanvasManager.initElement(this.canvas);
				}
				//our first restore will cause errors with excanvas and also
				//FF2 unless we save() the context immediately
				this.canvas.getContext('2d').save();
			}
			else {
				this.$canvas.css({
					width: this.width,
					height: this.height
				});
			}

			// Grab canvas context and clear/save it
			var context = this.canvas.getContext('2d');
			context.restore();
			context.save();
			context.clearRect(0, 0, this.width, this.height);

			// Draw the tip
			var coords = this._coords();
			context.beginPath();
			context.moveTo(coords[0].x, coords[0].y);
			context.lineTo(coords[1].x, coords[1].y);
			context.lineTo(coords[2].x, coords[2].y);
			context.closePath();
			context.fillStyle = this.fillColor;
			context.strokeStyle = this.borderColor;
			context.lineWidth = this.borderWidth;
			context.lineJoin = 'miter';
			context.miterLimit = 100;
			if(this.borderWidth) {
				context.stroke();
			}
			context.fill();

			return this;
		
		}


	});

	return Callout;

});
