define(function(require){

	var Controller = require('joss/mvc/Controller');
	var $ = require('jquery');


	module('joss/mvc/Controller');


	test('Event binding', function() {
		var fixture = $('#qunit-fixture');
		var el = $('<div></div>').appendTo('#qunit-fixture');

		var C = Controller.extend({
			'input click': function() {}
		});
	});

});
