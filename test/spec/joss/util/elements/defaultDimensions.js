define(function(require){

	var defaultDimensions = require('joss/util/elements/defaultDimensions');


	module('joss/util/elements/defaultDimensions');


	test('is immutable', function() {
		notStrictEqual(defaultDimensions(), defaultDimensions());
	});

});
