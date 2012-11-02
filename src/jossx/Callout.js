/*
 * Define a "callout", "tip", or "spike" of a typical tooltip.  This can be
 * used for other things, like creating an arrow.  For that reason, I'm being
 * exact here and defining a callout as a partial triangle whose two
 * visible sides, including stroke, precisely fill the specified width and
 * height.
 */
define(function(require) {

	var $ = require('jquery');
	var lang = require('dojo/_base/lang');
	var Position = require('joss/geometry/Position');
	var Point = require('joss/geometry/Point');
	var Line = require('joss/geometry/Line');
	var Classes = require('joss/util/Classes');
	var Elements = require('joss/util/Elements');
	var objectKeys = require('amd-utils/object/keys');
	require('joss/geometry/DomRect');



	var defaults = {
		element: null,
		canvas: null,
		width: 0,
		height: 0,
		borderWidth: 1,
		borderColor: 'rgb(0, 0, 0)',
		fillColor: 'rgb(255, 255, 255)',
		direction: new Position('right center')
	};

	var getset = objectKeys(defaults);


	var Callout = Classes.getset(getset, null, {

		constructor: function(opts) {

			opts = lang.mixin(defaults, opts);
			opts.element = opts.element || $('<div class="callout"></div>').appendTo('body');

			if (opts.width !== 0 && opts.height !== 0) {
				//var rect = opts.element.rect();
				opts.element.css('width', opts.width);
				opts.element.css('height', opts.height);
			}

			Classes.applyOptions(this, opts);

		},


		destroy: function() {
			this.$element.remove();
		},


		_setElement: function(el) {
			this._element = Elements.fromAny(el);
			this.$element = $(this._element);
			return this;
		},


		_setCanvas: function(el) {
			this._canvas = Elements.fromAny(el);
			this.$canvas = $(this._canvas);
			return this;
		},


		pointAt: function(pos) {

			var point = new Point();

			switch (pos.x()) {
				case 'left':
					point.x = 0;
					break;
				case 'right':
					point.x = this._width;
					break;
				default:
					point.x = this._width / 2;
					break;
			}

			switch (pos.y()) {
				case 'top':
					point.y = 0;
					break;
				case 'bottom':
					point.y = this._height;
					break;
				default:
					point.y = this._height / 2;
					break;
			}

			return point;
		
		},


		coords: function() {

			var pos = this._direction;
			var tip = this.pointAt(pos);

			var tipEdge;
			if (pos.precedence() === 'x') {
				tipEdge = pos.x();
			}
			else {
				tipEdge = pos.y();
			}

			//move the tip away from its edge to account for miter
			switch (tipEdge) {
				case 'top':
					tip.y += this._borderWidth / 2;
					break;
				case 'bottom':
					tip.y -= this._borderWidth / 2;
					break;
				case 'left':
					tip.x += this._borderWidth / 2;
					break;
				case 'right':
					tip.x -= this._borderWidth / 2;
					break;
			}


			//the opposite points, of course, lie at the corner points opposite
			//the tip
			var oppPos = [];
			oppPos[0] = pos.reverse();
			oppPos[1] = lang.clone(oppPos[0]);

			switch (oppPos[0].precedence()) {
				case 'x':
					oppPos[0].y('top');
					break;
				case 'y':
					oppPos[0].x('left');
					break;
			}

			switch (oppPos[1].precedence()) {
				case 'x':
					oppPos[1].y('bottom');
					break;
				case 'y':
					oppPos[1].x('right');
					break;
			}

			var lines = [];
			lines[0] = new Line(tip, this.pointAt(oppPos[0]));
			lines[1] = new Line(tip, this.pointAt(oppPos[1]));

			//console.log(this._direction);

			//We have to translate these lines inward to account for stroke width.
			//This is because canvas draws strokes as a "center" stroke, as
			//opposed to "inside" or "outside", and we need to use some linear algebra
			//to ensure a line at any angle will lie precisely within the canvas.
			var self = this;
			$.each(lines, function(i, line) {
				//vertical line, which is a simple translation
				if (line.m() === null) {

					if (oppPos[i].x() === 'left' || oppPos[i].y === 'top') {
						lines[i] = line.translate(self._borderWidth / 2, 0);
					}
					else {
						lines[i] = line.translate(-1 * self._borderWidth / 2, 0);
					}
				
				}
				//slanted lines can't be a simple translation, because the
				//closer a line gets to being parallel with its edge, the more
				//of its center-aligned border will bleed through the adjacent
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

					var d = self._borderWidth / 2;

					//console.log(oppPos[i]);

					var b2;
					// solve the distance between parallel lines formula
					// (http://en.wikipedia.org/wiki/Parallel_(geometry)#Distance_between_two_parallel_lines)
					// for b2, then we have a parallel line exactly borderWidth / 2px
					// from the the original line.
					if (
						(oppPos[i].precedence() === 'x' && oppPos[i].y() === 'top') 
						||
						(oppPos[i].precedence() === 'y' && oppPos[i].y() === 'bottom') 
					) {
						//-1 for canvas' inverted y coordinate system (remember?)
						b2 = -1 * line.b() + Math.sqrt( Math.pow(d, 2) * Math.pow(line.m(), 2) + Math.pow(d, 2) );
					}
					else {
						b2 = -1 * line.b() - Math.sqrt( Math.pow(d, 2) * Math.pow(line.m(), 2) + Math.pow(d, 2) );
					}

					//console.log(b2);
					lines[i] = Line.fromSlopeIntercept(line.m(), b2);
					
				}

			});

			var oppEdge;
			if (pos.precedence() === 'x') {
				oppEdge = pos.reverse().x();
			}
			else {
				oppEdge = pos.reverse().y();
			}

			//move the edge line a fair distance away from the real canvas
			//edge, to avoid rendering the line butting up against that edge
			var edges = {
				'top': new Line(new Point(0, -100), new Point(1, -100)),
				'left': new Line(new Point(-100, 0), new Point(-100, 1)),
				'right': new Line(new Point(this._width + 100, 0), new Point(this._width + 100, 1)),
				'bottom': new Line(new Point(0, this._height + 100), new Point(1, this._height + 100))
			};

			var coords = [];
			coords[0] = lines[0].intersection(edges[oppEdge]);
			coords[1] = lines[0].intersection(lines[1]);
			coords[2] = lines[1].intersection(edges[oppEdge]);

			//console.log(coords);

			return coords;
		
		},


		render: function() {

			var rect = this.$element.rect();
			this._width = rect.width();
			this._height = rect.height();

			if (!this.canvas()) {
				//define dimensions before initializing excanvas
				this.canvas($('<canvas width="' + this.width() + '" height="' + this.height() + '" />').appendTo(this.$element));
				this.$canvas.css('display', 'block');
				//excanvas for ie < 9
				if (window.G_vmlCanvasManager) {
					window.G_vmlCanvasManager.initElement(this.canvas());
				}
				//our first restore will cause errors with excanvas and also
				//FF2 unless we save() the context immediately
				this.canvas().getContext('2d').save();
			}
			else {
				this.$canvas.css({
					width: this.width(),
					height: this.height()
				});
			}

			// Grab canvas context and clear/save it
			var context = this.canvas().getContext('2d');
			context.restore(); 
			context.save();
			context.clearRect(0,0,this.width(),this.height());

			// Draw the tip
			var coords = this.coords();
			//console.log(coords);
			context.beginPath();
			context.moveTo(coords[0].x, coords[0].y);
			context.lineTo(coords[1].x, coords[1].y);
			context.lineTo(coords[2].x, coords[2].y);
			context.closePath();
			context.fillStyle = this._fillColor;
			context.strokeStyle = this._borderColor;
			//console.log('borderWidth: ', this._borderWidth);
			context.lineWidth = this._borderWidth + 2;
			context.lineJoin = 'miter';
			context.miterLimit = 100;
			if(this._borderWidth) {
				context.stroke();
			}
			context.fill();
		
		}


	});

	return Callout;

});
