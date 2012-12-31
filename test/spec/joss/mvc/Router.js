define(function(require){

	var Router = require('joss/mvc/Router');


	//keep track of how many times we change the hash, and erase history
	//afterwards.
	var routeCount = 0;

	var _route = function(hash) {
		setTimeout(function() {
			window.location.hash = hash;
		}, routeCount * 20);
		routeCount++;
	};

	var _finish = function(callback) {
		callback = callback || function() {};
		setTimeout(function() {
			callback();
			//remove history caused by changing window hash
			history.go(-1 * routeCount);
			routeCount = 0;
			start();
		}, (routeCount + 1) * 20);
	};


	module('joss/mvc/Router');


	asyncTest('Basics', function() {

		var count = {};

		var TestRouter = Router.extend({

			'*': function() {
				count['*'] = count['*'] || 0;
				count['*']++;
			},

			'*?': function() {
				count['*?'] = count['*?'] || 0;
				count['*?']++;
			},

			'/foo': function(fragment) {
				count[fragment] = count[fragment] || 0;
				count[fragment]++;
			},

			'/bar': function(fragment) {
				count[fragment] = count[fragment] || 0;
				count[fragment]++;
			}

		});

		TestRouter();

		var routes = ['foo', 'bar', 'baz', 'foo'];
		routes.forEach(function(hash) {
			_route('/' + hash);
		});

		_finish(function() {
			strictEqual(count['*'], 4, '* matched all hashchange events');
			strictEqual(count['*?'], 1, '*? matched all not-explicitly-defined hashchange events');
			strictEqual(count['/foo'], 2, '/foo matched twice');
			strictEqual(count['/bar'], 1, '/bar matched once');
		});

	});


	asyncTest('Arguments', function() {

		var TestRouter = Router.extend({

			'/{arg1}/{arg2}': function(arg1, arg2) {
				strictEqual(arg1, 'foo', 'arg1 parsed');
				strictEqual(arg2, 'bar', 'arg2 parsed');
			}

		});

		TestRouter();

		_route('/foo/bar/');

		_finish();

	});

});
