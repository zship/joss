define(function(require){

	var ObjectProxy = require('joss/util/ObjectProxy');


	module('joss/util/ObjectProxy');


	test('Basics', function() {
		var obj = {
			a: {
				b: {
					c: true
				}
			}
		};

		strictEqual(obj.a.b.c, true, 'Initial value');

		var proxy = new ObjectProxy(obj);
		proxy.a.b.c = false;
		strictEqual(obj.a.b.c, false, 'Proxy sets values on target');


		proxy.a.b.c = {
			d: true
		};
		var check = {
			a: {
				b: {
					c: {
						d: true
					}
				}
			}
		};
		deepEqual(obj, check, 'Proxy expands with deeper object properties');
	});

});
