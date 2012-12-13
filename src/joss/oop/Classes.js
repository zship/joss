/*
 * Static utility methods dealing with dojo "Classes"
 */
define(function(require) {

	var apply = require('./classes/apply');
	var chain = require('./classes/chain');
	var create = require('./classes/create');
	var defaults = require('./classes/defaults');
	var defineProp = require('./classes/defineProp');


	/**
	 * @namespace
	 * @alias joss/util/Classes
	 */
	var Classes = {};

	Classes.apply = apply;
	Classes.create = create;
	Classes.chain = chain;
	Classes.defaults = defaults;
	Classes.defineProp = defineProp;

	return Classes;

});
