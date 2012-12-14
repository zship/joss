define(function(require) {

	var create = require('./classes/create');


	var Class = create(/** @lends Class.prototype */{
		/**
		 * @class
		 * @constructs
		 */
		constructor: function() {},

		/**
		 * Convenience shortcut for {joss/oop/Classes.create}
		 * @method
		 * @param {String} [className]
		 * @param {...Constructor} [superclasses]
		 * @param {Object} members
		 * @return {Constructor}
		 */
		extend: create.bind(create, Class)
	});


	return Class;

});
