define(function(require){

	var Observable = require('joss/util/Observable');


	module('joss/util/Observable');


	test('Basics', function() {
		var obj = {
			a: 1,
			b: 2,
			c: 3
		};

		var observable = new Observable(obj);

		observable.observers.push(function(sender, key, val, prev) {
			ok(true, 'change observed');
			strictEqual(sender, obj, 'sender is the original wrapped object');
			strictEqual(key, 'a', 'correct key sent to observer');
			strictEqual(val, 4, 'correct new value sent to observer');
			strictEqual(prev, 1, 'correct prev value sent to observer');
		});

		observable.a = 4;


		obj = {
			a: {
				b: {
					c: true
				}
			}
		};

		observable = new Observable(obj);
		observable.observers.push(function(sender, key, val, prev) {
			ok(true, 'nested: change observed');
			strictEqual(sender, obj, 'nested: sender is the original wrapped object');
			strictEqual(key, 'a.b', 'nested: correct key sent to observer');
			deepEqual(val, {c: false}, 'nested: correct new value sent to observer');
			deepEqual(prev, {c: true}, 'nested: correct prev value sent to observer');
		});

		observable.a.b = {c: false};
	});

});
