define(function(require){

	var Lifecycle = require('joss/oop/Lifecycle');
	var $ = require('jquery');


	module('joss/oop/Lifecycle');


	asyncTest('start/stop', function() {

		var startCalled = [];
		var stopCalled = [];
		var startCompleted = false;
		var stopCompleted = false;

		var A = Lifecycle.extend({
			constructor: function() {
				this.contextTestA = 'A';
			},

			start: function() {
				startCalled.push('A');
				strictEqual(this.contextTestA, 'A', 'A: chained method retains context');
				var deferred = $.Deferred();
				window.setTimeout(function() {
					startCompleted = true;
					deferred.resolve();
				}, 0);
				return deferred;
			},

			stop: function() {
				stopCalled.push('A');
				strictEqual(stopCompleted, true, 'A: A.stop waited for B.stop to complete');
			}
		});

		var B = A.extend({
			constructor: function() {
				this._super();
				this.contextTestB = 'B';
			},

			start: function() {
				startCalled.push('B');
				strictEqual(this.contextTestB, 'B', 'B: chained method retains context');
				strictEqual(startCompleted, true, 'B: B.start waited for A.start to complete');
			},

			stop: function() {
				stopCalled.push('B');
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
			strictEqual(startCalled.join(' '), 'A B', 'A.start called before B.start');
			b.stop().then(function() {
				strictEqual(stopCalled.join(' '), 'B A', 'B.stop called before A.stop');
				start();
			});
		});

	});

});
