/*
 * Static utility methods dealing with dojo "Classes"
 */
define(function(require) {

	var chain = require('./classes/chain');
	var create = require('./classes/create');
	var defineProp = require('./classes/defineProp');


	/**
	 * @namespace
	 * @alias joss/util/Classes
	 */
	var Classes = {};

	Classes.create = create;
	Classes.chain = chain;
	Classes.defineProp = defineProp;

	return Classes;

});
