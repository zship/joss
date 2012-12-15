define(function(require){

	var Controller = require('joss/mvc/Controller');
	var hub = require('dojo/topic');
	var $ = require('jquery');


	module('joss/mvc/Controller');


	test('Event/pubsub binding', function() {
		expect(9);

		var outside = $('<div id="#outside"></div>').appendTo('#qunit-fixture');
		var input = $('<input type="button"></input>');
		var el = $('<div></div>').appendTo('#qunit-fixture');
		el.append(input);

		var instance;

		var C = Controller.extend({
			'input click': function(ev, tgt) {
				ok(true, 'click event triggered');
				strictEqual(tgt, input[0], 'event target passed correctly');
				strictEqual(this, instance, 'this === Controller instance');
			},

			'{#outside} click': function(ev, tgt) {
				ok(true, 'element outside root: click event triggered');
				strictEqual(tgt, outside[0], 'element outside root: event target passed correctly');
				strictEqual(this, instance, 'element outside root: this === Controller instance');
			},

			'user:create': function(user) {
				ok(true, 'pubsub: called');
				strictEqual(user.name, 'Zach', 'pubsub: argument passed correctly');
				strictEqual(this, instance, 'pubsub: this === Controller instance');
			}
		});

		instance = C({root: el});
		instance.start();

		input.trigger('click');
		outside.trigger('click');
		hub.publish('user:create', {name: 'Zach'});
	});

});
