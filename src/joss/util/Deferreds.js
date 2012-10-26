/*
 * Static utility methods dealing with Deferred objects
 */
define(function(require) {

	var $ = require('jquery');
	var lang = require('dojo/_base/lang');
	var Collections = require('joss/util/Collections');



	var Deferreds = {};


	//modified from the excellent jquery.waterfall plugin:
	//https://github.com/dio-el-claire/jquery.waterfall
	//Runs all passed functions in order, passing results to the next
	//function in the series. Returns $.Deferred object.
	Deferreds.series = function() {
		var steps = [],
		dfrd = $.Deferred(),
		pointer = 0;

		var args = [].slice.apply(arguments);
		if (args.length === 1 && args[0].length) {
			args = args[0];
		}

		$.each(args, lang.hitch(this, function(i, a) {
			steps.push(lang.hitch(this, function() {
				var args = [].slice.apply(arguments), d;

				if (typeof(a) === 'function') {
					d = a.apply(this, args);
					if (!(d && d.promise)) {
						d = $.Deferred()[d === false ? 'reject' : 'resolve'](d);
					}
				} else if (a && a.promise) {
					d = a;
				} else {
					d = $.Deferred()[a === false ? 'reject' : 'resolve'](a);
				}

				d.fail(function() {
					dfrd.reject.apply(dfrd, [].slice.apply(arguments));
				})
				.done(lang.hitch(this, function(data) {
					pointer++;
					args.push(data);

					if (pointer === steps.length) {
						dfrd.resolve.apply(dfrd, args);
					}
					else {
						steps[pointer].apply(this, args);
					}
				}));
			}));
		}));

		if (steps.length) {
			steps[0]();
		}
		else {
			dfrd.resolve();
		}

		return dfrd;
	};


	Deferreds.parallel = function() {
		return $.when.apply(this, arguments);
	};


	Deferreds.each = function(arr, iterator) {

		var superDeferred = $.Deferred();

		if (!arr.length) {
			superDeferred.reject();
		}

		var completed = 0;
		Collections.each(arr, function(item, key) {
			iterator(item, key)
			.fail(function(err) {
				superDeferred.reject(err);
			})
			.done(function() {
				completed++;
				if (completed === arr.length) {
					superDeferred.resolve();
				}
			});
		});

		return superDeferred;

	};


	Deferreds.eachSeries = function(arr, iterator) {

		var superDeferred = $.Deferred();

		if (!arr.length) {
			superDeferred.reject();
		}

		var completed = 0;
		var iterate = function() {
			iterator(arr[completed])
			.fail(function(err) {
				superDeferred.reject(err);
			})
			.done(function() {
				completed += 1;
				if (completed === arr.length) {
					superDeferred.resolve();
				}
				else {
					iterate();
				}
			});
		};
		iterate();

		return superDeferred;

	};


	var doParallel = function(fn) {
		return function () {
			var args = Array.prototype.slice.call(arguments);
			return fn.apply(null, [Deferreds.each].concat(args));
		};
	};


	var doSeries = function(fn) {
		return function () {
			var args = Array.prototype.slice.call(arguments);
			return fn.apply(null, [Deferreds.eachSeries].concat(args));
		};
	};


	var _map = function(eachfn, arr, iterator) {

		var superDeferred = $.Deferred();
		var results = [];

		arr = Collections.map(arr, function (val, i) {
			return {index: i, value: val};
		});

		eachfn(arr, function(item) {
			return iterator(item.value)
			.fail(function(err) {
				results[item.index] = err;
			})
			.done(function(transformed) {
				results[item.index] = transformed;
			});
		})
		.fail(function(err) {
			superDeferred.reject(err);
		})
		.done(function() {
			superDeferred.resolve(results);
		});

		return superDeferred;

	};


	Deferreds.map = doParallel(_map);
	Deferreds.mapSeries = doSeries(_map);


	Deferreds.reduce = function(arr, memo, iterator) {

		var superDeferred = $.Deferred();

		Deferreds.eachSeries(arr, function(item, key) {
			return iterator(memo, item, key, arr)
			.fail(function(val) {
				memo = val;
				superDeferred.reject(memo);
			});
		})
		.done(function() {
			superDeferred.resolve(memo);
		});

		return superDeferred;

	};


	Deferreds.inject = Deferreds.reduce;
	Deferreds.foldl = Deferreds.reduce;


	Deferreds.reduceRight = function(arr, memo, deferred) {
		var reversed = Collections.map(arr, function(val, i) {
			return {index: i, value: val};
		}).reverse();
		return Deferreds.reduce(reversed, memo, deferred);
	};


	Deferreds.foldr = Deferreds.reduceRight;


	/**
	 * @param {Function} iterator: Function returning a Deferred object
	 */
	var _filter = function(eachfn, arr, iterator) {

		var superDeferred = $.Deferred();
		var results = [];

		arr = Collections.map(arr, function(val, i) {
			return {index: i, value: val};
		});

		eachfn(arr, function(item) {
			return iterator(item.value)
			.done(function() {
				results.push(item);
			});
		})
		.fail(function() {
			superDeferred.reject();
		})
		.done(function() {
			results = results.sort(function(a, b) {
				return a.index - b.index;
			});
			results = Collections.map(results, function(item) {
				return item.value;
			});
			superDeferred.resolve(results);
		});

		return superDeferred;

	};


	Deferreds.filter = doParallel(_filter);
	Deferreds.filterSeries = doSeries(_filter);
	Deferreds.select = Deferreds.filter;
	Deferreds.selectSeries = Deferreds.filterSeries;


	var _reject = function(eachfn, arr, iterator) {

		var superDeferred = $.Deferred();
		var results = [];

		arr = Collections.map(arr, function(val, i) {
			return {index: i, value: val};
		});

		eachfn(arr, function (item) {
			return iterator(item.value)
			.fail(function() {
				results.push(item);
			});
		})
		.done(function() {
			results = results.sort(function(a, b) {
				return a.index - b.index;
			});
			results = Collections.map(results, function(item) {
				return item.value;
			});
			superDeferred.resolve(results);
		});

		return superDeferred;
	};


	Deferreds.reject = doParallel(_reject);
	Deferreds.rejectSeries = doSeries(_reject);


	var _detect = function(eachfn, arr, iterator) {

		var superDeferred = $.Deferred();

		eachfn(arr, function(item) {
			return iterator(item)
			.done(function() {
				superDeferred.resolve(item);
			});
		})
		.fail(function() {
			superDeferred.reject();
		})
		.done(function() {
			superDeferred.reject();
		});

		return superDeferred;

	};


	Deferreds.detect = doParallel(_detect);
	Deferreds.detectSeries = doSeries(_detect);
	Deferreds.find = Deferreds.detect;
	Deferreds.findSeries = Deferreds.detectSeries;


	Deferreds.some = function(arr, iterator) {

		var superDeferred = $.Deferred();

		Deferreds.each(arr, function(item) {
			return iterator(item)
			.done(function() {
				superDeferred.resolve();
			});
		})
		.fail(function() {
			superDeferred.reject();
		})
		.done(function() {
			superDeferred.reject();
		});

		return superDeferred;

	};


	Deferreds.any = Deferreds.some;


	Deferreds.every = function(arr, iterator) {

		var superDeferred = $.Deferred();

		Deferreds.each(arr, function(item) {
			return iterator(item)
				.fail(function() {
					superDeferred.reject();
				});
		})
		.done(function() {
			superDeferred.resolve();
		});

		return superDeferred;

	};


	Deferreds.all = Deferreds.every;


	return Deferreds;

});
