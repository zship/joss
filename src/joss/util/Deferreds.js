/*
 * Static utility methods dealing with Deferred objects
 */
define(function(require) {

	var $ = require('jquery');
	var Objects = require('joss/util/Objects');
	var Collections = require('joss/util/Collections');



	/**
	 * @namespace
	 * @alias joss.util.Deferreds
	 */
	var Deferreds = {};


	/**
	 * Invoke **iterator** once for each function in **arr**.
	 * @param {Array|Object} list
	 * @param {Function} iterator
	 * @return {jQuery.Deferred}
	 */
	Deferreds.forEach = function(list, iterator) {

		var superDeferred = $.Deferred();

		if (!Collections.size(list)) {
			superDeferred.reject();
			return superDeferred;
		}

		var completed = 0;
		Collections.forEach(list, function(item, key) {
			iterator(item, key)
			.fail(function() {
				superDeferred.reject();
			})
			.done(function() {
				completed++;
				if (completed === Collections.size(list)) {
					superDeferred.resolve();
				}
			});
		});

		return superDeferred;

	};


	/**
	 * Version of Deferreds#forEach which is guaranteed to execute passed
	 * functions in order.
	 * @param {Array|Object} list
	 * @param {Function} iterator
	 * @return {jQuery.Deferred}
	 */
	Deferreds.forEachSeries = function(list, iterator) {

		var superDeferred = $.Deferred();

		if (!Collections.size(list)) {
			superDeferred.reject();
			return superDeferred;
		}

		var completed = 0;
		var keys;
		if (!Objects.isArray(list)) {
			keys = Objects.keys(list);
		}

		var iterate = function() {
			var item;
			var key;

			if (Objects.isArray(list)) {
				key = completed;
				item = list[key];
			}
			else {
				key = keys[completed];
				item = list[key];
			}

			iterator(item, key)
			.fail(function() {
				superDeferred.reject();
			})
			.done(function() {
				completed += 1;
				if (completed === Collections.size(list)) {
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
		return function() {
			var args = Collections.toArray(arguments);
			return fn.apply(null, [Deferreds.forEach].concat(args));
		};
	};


	var doSeries = function(fn) {
		return function() {
			var args = Collections.toArray(arguments);
			return fn.apply(null, [Deferreds.forEachSeries].concat(args));
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

		Deferreds.everySeries(arr, function(item, key) {
			return iterator(memo, item, key, arr);
		})
		.fail(function() {
			superDeferred.reject();
		})
		.done(function() {
			superDeferred.resolve(memo);
		});

		return superDeferred;

	};


	Deferreds.reduceRight = function(arr, memo, iterator) {
		var reversed = Collections.map(arr, function(val, i) {
			return {index: i, value: val};
		}).reverse();
		reversed = Collections.pluck(reversed, 'value');
		return Deferreds.reduce(reversed, memo, iterator);
	};


	/**
	 * @param {Function} iterator: Function returning a Deferred object
	 */
	var _filter = function(eachfn, arr, iterator) {

		var superDeferred = $.Deferred();
		var results = [];

		arr = Collections.map(function(val, i) {
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
			results = Collections.pluck(results, 'value');
			superDeferred.resolve(results);
		});

		return superDeferred;

	};


	Deferreds.filter = doParallel(_filter);
	Deferreds.filterSeries = doSeries(_filter);


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
		.fail(function() {
			superDeferred.reject();
		})
		.done(function() {
			results = results.sort(function(a, b) {
				return a.index - b.index;
			});
			results = Collections.pluck(results, 'value');
			superDeferred.resolve(results);
		});

		return superDeferred;
	};


	Deferreds.reject = doParallel(_reject);
	Deferreds.rejectSeries = doSeries(_reject);


	var _find = function(eachfn, arr, iterator) {

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


	Deferreds.find = doParallel(_find);
	Deferreds.findSeries = doSeries(_find);


	Deferreds.some = function(arr, iterator) {

		var superDeferred = $.Deferred();

		Deferreds.forEach(arr, function(item) {
			return iterator(item)
			.done(function() {
				superDeferred.resolve();
			});
		})
		.fail(function() {
			superDeferred.reject();
		})
		.done(function() {
			superDeferred.resolve();
		});

		return superDeferred;

	};


	Deferreds.every = function(arr, iterator) {

		var superDeferred = $.Deferred();

		Deferreds.forEach(arr, function(item) {
			return iterator(item)
			.fail(function() {
				superDeferred.reject();
			});
		})
		.fail(function() {
			superDeferred.reject();
		})
		.done(function() {
			superDeferred.resolve();
		});

		return superDeferred;

	};


	var _isDeferredObject = function(obj) {
		return obj && obj.promise;
	};


	Deferreds.anyToDeferred = function(obj) {
		//any arguments after obj will be passed to obj(), if obj is a function
		var args = Array.prototype.slice.call(arguments, 1);
		if (_isDeferredObject(obj)) {
			return obj;
		}
		else if (Objects.isFunction(obj)) {
			var result = obj.apply(obj, args);
			if (!_isDeferredObject(result)) {
				return $.Deferred().resolve(result);
			}
			return result;
		}
		else {
			return $.Deferred().resolve(obj);
		}
	};


	Deferreds.parallel = function(tasks) {

		var superDeferred = $.Deferred();

		if (arguments.length > 1) {
			tasks = Collections.toArray(arguments);
		}

		if (Objects.isArray(tasks)) {
			Deferreds.map(tasks, function(task) {
				return Deferreds.anyToDeferred(task);
			})
			.fail(function() {
				superDeferred.reject();
			})
			.done(function(results) {
				superDeferred.resolve(results);
			});
		}
		else {
			var results = {};
			Deferreds.forEach(tasks, function(task, key) {
				var deferred = Deferreds.anyToDeferred(task);
				return deferred.done(function(result) {
					results[key] = result;
				});
			})
			.fail(function() {
				superDeferred.reject();
			})
			.done(function() {
				superDeferred.resolve(results);
			});
		}

		return superDeferred;

	};


	Deferreds.series = function(tasks) {

		var superDeferred = $.Deferred();

		if (arguments.length > 1) {
			tasks = Collections.toArray(arguments);
		}

		if (Objects.isArray(tasks)) {
			Deferreds.mapSeries(tasks, function(task) {
				return Deferreds.anyToDeferred(task);
			})
			.fail(function() {
				superDeferred.reject();
			})
			.done(function(result) {
				superDeferred.resolve(result);
			});
		}
		else {
			var results = {};
			Deferreds.forEachSeries(tasks, function(task, key) {
				var deferred = Deferreds.anyToDeferred(task);
				return deferred.done(function(result) {
					results[key] = result;
				});
			})
			.fail(function() {
				superDeferred.reject();
			})
			.done(function() {
				superDeferred.resolve(results);
			});
		}

		return superDeferred;

	};


	Deferreds.waterfall = function(tasks) {

		var superDeferred = $.Deferred();

		if (arguments.length > 1) {
			tasks = Collections.toArray(arguments);
		}

		if (!Collections.size(tasks)) {
			superDeferred.reject();
			return superDeferred;
		}

		var completed = 0;
		var keys;
		if (!Objects.isArray(tasks)) {
			keys = Objects.keys(tasks);
		}

		var iterate = function() {
			var args = Collections.toArray(arguments);
			var task;
			var key;

			if (Objects.isArray(tasks)) {
				key = completed;
				task = tasks[key];
			}
			else {
				key = keys[completed];
				task = tasks[key];
			}

			args.unshift(task);

			Deferreds.anyToDeferred.apply(this, args)
			.fail(function(err) {
				superDeferred.reject(key, err);
			})
			.done(function(result) {
				completed += 1;
				if (completed === Collections.size(tasks)) {
					superDeferred.resolve(result);
				}
				else {
					iterate(result);
				}
			});
		};

		iterate();

		return superDeferred;

	};


	Deferreds.whilst = function(test, iterator) {

		var superDeferred = $.Deferred();

		if (test()) {
			iterator()
			.fail(function(err) {
				superDeferred.reject(err);
			})
			.done(function() {
				Deferreds.whilst(test, iterator);
			});
		}
		else {
			superDeferred.resolve();
		}

		return superDeferred;

	};


	Deferreds.until = function(test, iterator) {

		var superDeferred = $.Deferred();

		if (!test()) {
			iterator()
			.fail(function(err) {
				superDeferred.reject(err);
			})
			.done(function() {
				Deferreds.until(test, iterator);
			});
		}
		else {
			superDeferred.resolve();
		}

		return superDeferred;

	};



	return Deferreds;

});
