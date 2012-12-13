define(function(require) {

	var Classes = require('joss/oop/Classes');
	var lang = require('dojo/_base/lang');


	//Abstraction of relative positioning information, modeled after jQuery UI
	//(more predictable) and jquery.qTip (more precise)
	var Position = Classes.create(/** @lends joss/geometry/Position.prototype */ {

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


		/**
		 * @return {joss/geometry/Position}
		 */
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


		/**
		 * @return {String}
		 */
		toString: function() {
			if (this.precedence === 'x') {
				return this.x + ' ' + this.y;
			}
			else {
				return this.y + ' ' + this.x;
			}
		}
	
	}); //Position


	/**
	 * translate something like 'left top' into a joss.Position object. order
	 * doesn't matter.
	 * @param {String} str
	 * @return {joss/geometry/Position}
	 */
	Position.fromString = function(str) {
		var parts = str.split(' ');
		var axes = [];

		if (parts.length === 1) {
			parts[1] = 'center';
		}

		parts.forEach(function(part, i) {
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
		pos.precedence = axes[0];

		axes.forEach(function(axis, i) {
			switch(axis) {
				case 'x':
					pos.x = parts[i];
					break;
				case 'y':
					pos.y = parts[i];
					break;
			}
		});

		return pos;
	};

	return Position;

});
