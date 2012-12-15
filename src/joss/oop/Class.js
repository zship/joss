define(function(require) {

	var Classes = require('./Classes');


	var Class = Classes.create(/** @lends Class.prototype */{

		/**
		 * @class
		 * @constructs
		 */
		constructor: function() {},


		destroy: function() {}

	});


	/**
	 * Convenience shortcut for {joss/oop/Classes.create}
	 * @method
	 * @param {String} [className]
	 * @param {...joss/oop/Class} [superclasses]
	 * @param {Object} members
	 * @return {Constructor}
	 */
	Class.extend = Classes.create.bind(Classes.create, Class);


	Classes.chain(Class, 'destroy', 'before');


	return Class;

});
