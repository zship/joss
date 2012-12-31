define(function(require){

	var Class = require('joss/oop/Class');


	module('joss/oop/Class');


	//string of linearized class heirarchy
	var lin = function(ctor) {
		return ctor._meta.bases.map(function(base) {
			return base._meta.name;
		}).join(' ');
	};


	test('extend()', function() {
		var A = Class.extend({});
		var B = A.extend({});

		strictEqual(lin(B), 'A Class', 'A.extend creates a constructor inheriting from A');

		var C = B.extend({});

		strictEqual(lin(C), 'B A Class', 'B.extend creates a constructor inheriting from (B, A)');
	});

});
