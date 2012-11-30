/*
 Position

 Abstraction of relative positioning information, 
 modeled after jQuery UI (more predictable)
 and jquery.qTip (more precise)
 */
define(function(require) {

	var $ = require('jquery');
	var Classes = require('joss/util/Classes');
	var lang = require('dojo/_base/lang');



	var Position = Classes.create(/** @lends joss/geometry/Position.prototype */ {

		'-accessors-': ['x', 'y', 'precedence'],


		/**
		 * @class Position
		 * @constructs
		 */
		constructor: function(opts) {

			if (opts && opts.constructor === String) {
				var base = Position.fromString(opts);
				opts = {
					x: base.x,
					y: base.y,
					precedence: base.precedence
				};
			}

			opts = lang.mixin({
				x: null,
				y: null,
				precedence: null
			}, opts); 

			/** @type {String} */
			this.x = opts.x;
			/** @type {String} */
			this.y = opts.y;
			/** @type {String} */
			this.precedence = opts.precedence;
		
		},


		reverse: function() {
			var pos = lang.clone(this);

			if (pos.x === 'left') {
				pos.x = 'right';
			}
			else if (pos.x === 'right') {
				pos.x = 'left';
			}
			else {
				pos.x = 'center';
			}

			if (pos.y === 'top') {
				pos.y = 'bottom';
			}
			else if (pos.y === 'bottom') {
				pos.y = 'top';
			}
			else {
				pos.y = 'center';
			}

			return pos;
		},


		toString: function() {
			if (this._precedence === 'x') {
				return this.x + ' ' + this.y;
			}
			else {
				return this.y + ' ' + this.x;
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
