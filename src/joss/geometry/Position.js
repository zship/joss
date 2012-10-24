/*
 Position

 Abstraction of relative positioning information, 
 modeled after jQuery UI (more predictable)
 and jquery.qTip (more precise)
 */
define(function(require) {

	var $ = require('jquery');
	var declare = require('dojo/_base/declare');
	var lang = require('dojo/_base/lang');



	var Position = declare(null, {
		constructor: function(opts) {

			if (opts && opts.constructor === String) {
				var base = Position.fromString(opts);
				opts = {
					x: base.x(),
					y: base.y(),
					precedence: base.precedence()
				};
			}

			opts = lang.mixin({
				x: null,
				y: null,
				precedence: null
			}, opts); 

			this._x = opts.x;
			this._y = opts.y;
			this._precedence = opts.precedence;
		
		},

		_x: null,
		_y: null,
		_precedence: null, //which axis is declared first

		x: function(val) {
			if (val) {
				return this._setX(val);
			}
			return this._getX();
		},

		_getX: function() {
			return this._x;
		},

		_setX: function(val) {
			this._x = val;
			return this;
		},

		y: function(val) {
			if (val) {
				return this._setY(val);
			}
			return this._getY();
		},

		_getY: function() {
			return this._y;
		},

		_setY: function(val) {
			this._y = val;
			return this;
		},

		precedence: function(val) {
			if (val) {
				return this._setPrecedence(val);
			}
			return this._getPrecedence();
		},

		_getPrecedence: function() {
			return this._precedence;
		},

		_setPrecedence: function(val) {
			this._precedence = val;
			return this;
		},

		reverse: function() {
			var pos = lang.clone(this);

			if (pos._x === 'left') {
				pos._x = 'right';
			}
			else if (pos._x === 'right') {
				pos._x = 'left';
			}
			else {
				pos._x = 'center';
			}

			if (pos._y === 'top') {
				pos._y = 'bottom';
			}
			else if (pos._y === 'bottom') {
				pos._y = 'top';
			}
			else {
				pos._y = 'center';
			}

			return pos;
		},

		toString: function() {
			if (this._precedence === 'x') {
				return this._x + ' ' + this._y;
			}
			else {
				return this._y + ' ' + this._x;
			}
		}
	
	}); //Position


	//translate something like 'left top' into a joss.Position object
	//order doesn't matter.
	Position.fromString = function(str) {
		var parts = str.split(' ');
		var axes = [];

		$.each(parts, function(i, part) {
			switch (part) {
				case 'left':
				case 'right':
					axes[i] = 'x';
					break;
				case 'top':
				case 'bottom':
					axes[i] = 'y';
					break;
				default:
					axes[i] = null;
					parts[i] = 'center';
					break;
			}
		});

		//each axis, if null ("center" was given), is the opposite of the other axis
		axes[0] = axes[0] || ((axes[1] === 'x') ? 'y' : 'x');
		axes[1] = axes[1] || ((axes[0] === 'x') ? 'y' : 'x');

		var pos = new Position();
		pos._precedence = axes[0];

		$.each(axes, function(i, axis) {
			switch(axis) {
				case 'x':
					pos._x = parts[i];
					break;
				case 'y':
					pos._y = parts[i];
					break;
			}
		});

		return pos;
	};

	return Position;

});
