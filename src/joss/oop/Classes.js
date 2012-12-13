/*
 * Static utility methods dealing with dojo "Classes"
 */
define(function(require) {

	/**
	 * @namespace
	 */
	var Classes = {
		apply: require('./classes/apply'),
		chain: require('./classes/chain'),
		create: require('./classes/create')
	};

	return Classes;

});
