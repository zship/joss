define(function(require) {

	var Classes = require('joss/util/Classes');



	//Defines the size of a two-dimensional object
	var Size = Classes.create(/** @lends joss/geometry/Size.prototype */ {

		/**
		 * @param {Number} width
		 * @param {Number} height
		 * @constructs
		 */
		constructor: function(width, height) {

			this.width = width || 0;
			this.height = height || 0;

		},


		/** @type {Number} */
		width: null,


		/** @type {Number} */
		height: null,


		/**
		 * Scales the size to a rectangle with the given `other` size,
		 * according to `mode`.
		 * @param {joss/geometry/Size} other
		 * @param {joss/geometry/Size.AspectRatioMode} mode
		 * @return {joss/geometry/Size}
		 */
		scale: function(other, mode) {

			if (mode === Size.AspectRatioMode.Ignore) {
				this.width = other.width;
				this.height = other.height;
				return this;
			}

			var useHeight = false;
			var scaledWidth = other.height * this.width / this.height;

			if (mode === Size.AspectRatioMode.Keep) {
				useHeight = (scaledWidth <= other.width);
			}
			else { // mode == Size.AspectRatioMode.KeepByExpanding
				useHeight = (scaledWidth >= other.width);
			}

			if (useHeight) {
				this.width = scaledWidth;
				this.height = other.height;
			}
			else {
				this.width = other.width;
				this.height = other.width * this.height / this.width;
			}

			return this;

		},


		/**
		 * Swaps the width and height values.
		 * @return {joss/geometry/Size}
		 */
		transpose: function() {
			var tmp = this.width;
			this.width = this.height;
			this.height = tmp;
			return this;
		}

	});


	Size.AspectRatioMode = {
		Ignore: 1,
		Keep: 2,
		KeepByExpanding: 3
	};


	return Size;

});
