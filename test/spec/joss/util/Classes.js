define(function(require){

	var Classes = require('joss/util/Classes');
	var $ = require('jquery');



	module('joss/util/Classes');

	test('Generated Accessors', function() {
		var Class = Classes.create({
			'-accessors-': ['a', 'b']
		});

		var obj = new Class();
		obj.a(1);
		strictEqual(obj.a(), 1, 'Getter a = 1');
		strictEqual(obj._a, 1, 'Setter a = 1');

		obj.b(2);
		strictEqual(obj.b(), 2, 'Getter b = 2');
		strictEqual(obj._b, 2, 'Setter b = 2');
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
