define(function(require){

	var Classes = require('joss/oop/Classes');
	var $ = require('jquery');



	module('joss/oop/Classes');


	test('Inheritance', function() {
		var lin = function(ctor) {
			return ctor._meta.bases.map(function(base) {
				return base._meta.name;
			}).join(' ');
		};

		var A = Classes.create({});
		var B = Classes.create(A, {});
		var C = Classes.create(B, {});

		strictEqual(lin(C), 'B A', 'single inheritance');

		A = Classes.create({});
		B = Classes.create({});
		C = Classes.create(B, A, {});

		strictEqual(lin(C), 'B A', 'multiple inheritance');

		A = Classes.create({});
		B = Classes.create({});
		C = Classes.create(A, B, {});

		strictEqual(lin(C), 'A B', 'multiple inheritance 2');

		//more complex: from http://www.python.org/download/releases/2.3/mro/
		/*
                                  ---
         Level 3                 | O |                  (more general)
                               /  ---  \
                              /    |    \                      |
                             /     |     \                     |
                            /      |      \                    |
                           ---    ---    ---                   |
         Level 2        3 | D | 4| E |  | F | 5                |
                           ---    ---    ---                   |
                            \  \ _ /       |                   |
                             \    / \ _    |                   |
                              \  /      \  |                   |
                               ---      ---                    |
         Level 1            1 | B |    | C | 2                 |
                               ---      ---                    |
                                 \      /                      |
                                  \    /                      \ /
                                    ---
         Level 0                 0 | A |                (more specialized)
                                    ---
		*/
		var O = Classes.create({});
		var F = Classes.create(O, {});
		var E = Classes.create(O, {});
		var D = Classes.create(O, {});
		C = Classes.create(D, F, {});
		B = Classes.create(D, E, {});
		A = Classes.create(B, C, {});

		strictEqual(lin(B), 'D E O', 'complex multiple inheritance 1');
		strictEqual(lin(C), 'D F O', 'complex multiple inheritance 2');
		strictEqual(lin(A), 'B C D E F O', 'complex multiple inheritance 3');
	});


	test('_super', function() {
		//in AOP "before" order
		var called = [];
		var A = Classes.create({
			start: function() {
				called.push('A');
			}
		});

		var B = Classes.create(A, {
			start: function() {
				this._super();
				called.push('B');
			}
		});

		var C = Classes.create(B, {
			start: function() {
				this._super();
				called.push('C');
			}
		});

		var c = new C();
		c.start();

		strictEqual(called.join(' '), 'A B C', '_start called before: methods called in correct order');


		//in AOP "after" order
		called = [];
		A = Classes.create({
			start: function() {
				called.push('A');
			}
		});

		B = Classes.create(A, {
			start: function() {
				called.push('B');
				this._super();
			}
		});

		C = Classes.create(B, {
			start: function() {
				called.push('C');
				this._super();
			}
		});

		c = new C();
		c.start();

		strictEqual(called.join(' '), 'C B A', '_start called after: methods called in correct order');


		//returning values from _super()
		A = Classes.create({
			start: function() {
				return 'A1';
			}
		});

		B = Classes.create(A, {
			start: function() {
				var ret = this._super();
				return ret + ' B2';
			}
		});

		C = Classes.create(B, {
			start: function() {
				var ret = this._super();
				return ret + ' C3';
			}
		});

		c = new C();
		var ret = c.start();

		strictEqual(ret, 'A1 B2 C3', 'returning values from _super');
	});


	test('Generated Accessors', function() {
		var Class = Classes.create({
			constructor: function() {
				this._data = {
					a: 0,
					b: 0
				};
			}
		});

		Classes.defineProp(Class, 'a');
		Classes.defineProp(Class, 'b');

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
			constructor: function() {
				this._data = {
					a: {
						b: 'init'
					}
				};
			},

			'set a.b': function(val) {
				called = true;
				this._data.a.b = val;
			}
		});


		var obj = new Class();
		strictEqual(obj.a.b, 'init', 'initial a.b');

		obj.a.b = 'foo';
		ok(called, 'a.b setter was called');
		called = false;
		strictEqual(obj.a.b, 'foo', 'change a.b, get a.b');
		strictEqual(obj._data.a.b, 'foo', 'change a.b, get a.b === _data.a.b');

		obj.a = {
			b: 'bar'
		};
		ok(called, 'a.b setter was called');
		called = false;
		strictEqual(obj.a.b, 'bar', 'changed a, get a.b');
		strictEqual(obj._data.a.b, 'bar', 'changed a, get a.b === _data.a.b');

		obj.a.b = 'baz';
		ok(called, 'a.b setter was called');
		called = false;
		strictEqual(obj.a.b, 'baz', 'changed a, set a.b');
		strictEqual(obj._data.a.b, 'baz', 'changed a, set a.b, a.b === _data.a.b');

		obj.a = {
			b: {
				c: 'foo'
			}
		};

		strictEqual(obj.a.b.c, 'foo', 'add a.b.c (more deeply-nested than original definition of a)');
		strictEqual(obj._data.a.b.c, 'foo', 'add a.b.c, a.b.c === _data.a.b.c');

		obj.a.b.c = 'bar';

		strictEqual(obj.a.b.c, 'bar', 'change a.b.c');
		strictEqual(obj._data.a.b.c, 'bar', 'change a.b.c, a.b.c === _data.a.b.c');

		obj.a.b = {
			c: 'baz'
		};

		strictEqual(obj.a.b.c, 'baz', 'change a.b, get a.b.c');
		strictEqual(obj._data.a.b.c, 'baz', 'change a.b, get a.b.c === _data.a.b.c');
	});


	asyncTest('Deferred Chaining', function() {
		var startCalled = 0;
		var stopCalled = 0;
		var startCompleted = false;
		var stopCompleted = false;

		var A = Classes.create({
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

		Classes.chain(A, 'start', 'after');
		Classes.chain(A, 'stop', 'before');

		var B = Classes.create(A, {
			constructor: function() {
				this._super();
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
