define(function(require){

	var Classes = require('joss/util/Classes');
	var $ = require('jquery');



	module('joss/util/Classes');

	test('Generated Accessors', function() {
		var Class = Classes.create({
			'-accessors-': ['a', 'b'],
			constructor: function() {
				this._a = 0;
				this._b = 0;
			}
		});

		var keys = Object.getOwnPropertyNames(Class.prototype);
		ok(keys.indexOf('a') !== -1, 'a is a property');
		ok(keys.indexOf('b') !== -1, 'b is a property');

		var obj = new Class();
		strictEqual(obj.a, 0, 'getter a');
		obj.a = 1;
		strictEqual(obj.a, 1, 'setter a');

		strictEqual(obj.b, 0, 'getter b');
		obj.b = 2;
		strictEqual(obj.b, 2, 'setter a');
	});


	test('Nested Accessors', function() {
		var called = false;
		var Class = Classes.create({
			'-accessors-': ['a', 'a.b'],

			constructor: function() {
				this.a = {b: 'init'};
			},

			'set a.b': function(val) {
				called = true;
				this._a._b = val;
			}
		});


		var obj = new Class();
		strictEqual(obj.a.b, 'init', 'initial a.b');

		obj.a.b = 'foo';
		ok(called, 'a.b setter was called');
		called = false;
		strictEqual(obj.a.b, 'foo', 'change a.b, get a.b');

		obj.a = {
			b: 'bar'
		};
		ok(called, 'a.b setter was called');
		called = false;
		strictEqual(obj.a.b, 'bar', 'changed a, get a.b');

		obj.a.b = 'baz';
		ok(called, 'a.b setter was called');
		called = false;
		strictEqual(obj.a.b, 'baz', 'changed a, set a.b');
	});


	asyncTest('Deferred Chaining', function() {
		var startCalled = 0;
		var stopCalled = 0;
		var startCompleted = false;
		var stopCompleted = false;

		var A = Classes.create({
			'-chains-': {
				'start': 'deferredAfter',
				'stop': 'deferredBefore'
			},

			constructor: function() {
				this.contextTestA = 'A';
			},

			start: function() {
				startCalled++;
				strictEqual(startCalled, 1, 'A: A.start called before B.start');
				strictEqual(this.contextTestA, 'A', 'A: chained method retains context');
				var deferred = $.Deferred();
				window.setTimeout(function() {
					startCompleted = true;
					deferred.resolve();
				}, 0);
				return deferred;
			},

			stop: function() {
				stopCalled++;
				strictEqual(stopCalled, 2, 'A: B.stop called before A.stop');
				strictEqual(stopCompleted, true, 'A: A.stop waited for B.stop to complete');
			}
		});

		var B = Classes.create(A, {
			constructor: function() {
				this.contextTestB = 'B';
			},

			start: function() {
				startCalled++;
				strictEqual(startCalled, 2, 'B: A.start called before B.start');
				strictEqual(this.contextTestB, 'B', 'B: chained method retains context');
				strictEqual(startCompleted, true, 'B: B.start waited for A.start to complete');
			},

			stop: function() {
				stopCalled++;
				strictEqual(stopCalled, 1, 'B: B.stop called before A.stop');
				var deferred = $.Deferred();
				window.setTimeout(function() {
					stopCompleted = true;
					deferred.resolve();
				}, 0);
				return deferred;
			}
		});

		var b = new B();
		b.start().then(function() {
			b.stop().then(function() {
				start();
			});
		});
	});

});
