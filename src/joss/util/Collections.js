/*
 * Static utility methods dealing with Collections (Arrays or Objects)
 */
define(function(require) {

	var Objects = require('joss/util/Objects');
	var Functions = require('joss/util/Functions');



	/** 
	 * @namespace
	 * @alias joss.util.Collections
	 */
	var Collections = {};


	/**
	 * A "forEach" loop. Calls **iterator** once for every element in **list**.
	 * Delegates to `Array.prototype.forEach` if available.
	 *
	 * @param {Array|Object} list
	 * @param {Function} iterator
	 *   `function(element, index, list)` or `function(value, key, list)`
	 */
	Collections.forEach = function(list, iterator, context) {
		list = list || [];

		if (Array.prototype.forEach && list.forEach === Array.prototype.forEach) {
			list.forEach(iterator, context);
		}
		else if (list.length === +list.length) {
			for (var i = 0, l = list.length; i < l; i++) {
				iterator.call(context, list[i], i, list);
			}
		}
		else {
			for (var key in list) {
				if (Collections.has(list, key)) {
					iterator.call(context, list[key], key, list);
				}
			}
		}
	};


	/**
	 * An enhanced "forEach" loop. Calls **iterator** once for every element in
	 * **list**.  If **iterator** returns `false`, break the loop.
	 *
	 * @param {Array|Object} list
	 * @param {Function} iterator
	 *   `function(element, index, list)` or `function(value, key, list)`
	 */
	Collections.each = function(list, iterator, context) {
		list = list || [];

		if (list.length === +list.length) {
			for (var i = 0, l = list.length; i < l; i++) {
				if (iterator.call(context, list[i], i, list) === false) {
					break;
				}
			}
		}
		else {
			for (var key in list) {
				if (!Objects.has(list, key)) {
					continue;
				}
				if (iterator.call(context, list[key], key, list) === false) {
					break;
				}
			}
		}
	};


	/**
	 * Transform each element by passing it through **iterator** and appending
	 * it to a new array. Delegates to `Array.prototype.map` if available.
	 *
	 * @param {Array|Object} list
	 * @param {Function} iterator
	 *   `function(element, index, list)` or `function(value, key, list)`
	 * @return {Array} The transformed array
	 */
	Collections.map = function(list, iterator, context) {
		list = list || [];
		var results = [];

		if (Array.prototype.map && list.map === Array.prototype.map) {
			return list.map(iterator, context);
		}
		Collections.forEach(list, function(value, index, list) {
			results[results.length] = iterator.call(context, value, index, list);
		});

		return results;
	};


	/**
	 * Convenience version of joss.util.Collections#map: extract property
	 * values with key **key**
	 *
	 * @param {Array|Object} list
	 * @param {String} key
	 * @return {Array}
	 */
	Collections.pluck = function(list, key) {
		return Collections.map(list, function(value) { 
			return value[key]; 
		});
	};


	/**
	 * Boil down a list of values to a single value by passing **memo** (the
	 * state of the reduction) and each value to **iterator**.
	 *
	 * @param {Array|Object} list
	 * @param {Function} iterator
	 *   `function(memo, element, index, list)` or `function(memo, value, key, list)`
	 * @param {Any} memo
	 * @return {Any} Final state of **memo**
	 */
	Collections.reduce = function(list, iterator, memo, context) {
		list = list || [];

		if (Array.prototype.reduce && list.reduce === Array.prototype.reduce) {
			if (context) {
				iterator = Functions.bind(iterator, context);
			}
			return memo ? list.reduce(iterator, memo) : list.reduce(iterator);
		}

		Collections.forEach(list, function(value, index, list) {
			memo = memo || value;
			memo = iterator.call(context, memo, value, index, list);
		});

		return memo;
	};


	/**
	 * The right-associative version of joss.util.Collections#reduce.
	 *
	 * @param {Array|Object} list
	 * @param {Function} iterator
	 *   `function(memo, element, index, list)` or `function(memo, value, key, list)`
	 * @param {Any} memo
	 * @return {Any} Final state of **memo**
	 */
	Collections.reduceRight = function(list, iterator, memo, context) {
		list = list || [];

		if (Array.prototype.reduceRight && list.reduceRight === Array.prototype.reduceRight) {
			if (context) {
				iterator = Functions.bind(iterator, context);
			}
			return memo ? list.reduceRight(iterator, memo) : list.reduceRight(iterator);
		}

		var reversed = Collections.map(list, function(val, i) {
			return {index: i, value: val};
		}).reverse();

		reversed = Collections.pluck(reversed, 'value');

		return Collections.reduce(reversed, iterator, memo, context);
	};


	/**
	 * Return the first value passing the truth test provided by **iterator**
	 *
	 * @param {Array|Object} list
	 * @param {Function} iterator
	 *   `function(element, index, list)` or `function(value, key, list)`
	 * @return {Any}
	 */
	Collections.find = function(list, iterator, context) {
		var result;
		Collections.forEach(list, function(value, index, list) {
			if (iterator.call(context, value, index, list)) {
				result = value;
				return false; //break
			}
		});
		return result;
	};


	/**
	 * Return all elements passing the truth test provided by **iterator**.
	 * Delegates to `Array.prototype.filter` if available.
	 *
	 * @param {Array|Object} list
	 * @param {Function} iterator
	 *   `function(element, index, list)` or `function(value, key, list)`
	 * @return {Array}
	 */
	Collections.filter = function(list, iterator, context) {
		list = list || [];
		var results = [];

		if (Array.prototype.filter && list.filter === Array.prototype.filter) {
			return list.filter(iterator, context);
		}
		Collections.forEach(list, function(value, index, list) {
			if (iterator.call(context, value, index, list)) {
				results[results.length] = value;
			}
		});

		return results;
	};


	/**
	 * Return all elements failing the truth test provided by **iterator**
	 *
	 * @param {Array|Object} list
	 * @param {Function} iterator
	 *   `function(element, index, list)` or `function(value, key, list)`
	 * @return {Array}
	 */
	Collections.reject = function(list, iterator, context) {
		return Collections.filter(list, function(value, index, list) {
			return !iterator.call(context, value, index, list);
		}, context);
	};


	/**
	 * Determine whether *all* elements match the truth test given by **iterator**
	 *
	 * @param {Array|Object} list
	 * @param {Function} iterator
	 *   `function(element, index, list)` or `function(value, key, list)`
	 * @return {Boolean}
	 */
	Collections.every = function(list, iterator, context) {
		list = list || [];
		var result = true;

		if (Array.prototype.every && list.every === Array.prototype.every) {
			return list.every(iterator, context);
		}
		Collections.each(list, function(value, index, list) {
			result = iterator.call(context, value, index, list);
			if (result === false) {
				return false; //break
			}
		});

		return !!result;
	};


	/**
	 * Determine whether *any* elements match the truth test given by **iterator**
	 *
	 * @param {Array|Object} list
	 * @param {Function} iterator
	 *   `function(element, index, list)` or `function(value, key, list)`
	 * @return {Boolean}
	 */
	Collections.some = function(list, iterator, context) {
		list = list || [];
		var result = false;

		if (Array.prototype.some && list.some === Array.prototype.some) {
			return list.some(iterator, context);
		}
		Collections.each(list, function(value, index, list) {
			result = iterator.call(context, value, index, list);
			if (result === true) {
				return false; //break
			}
		});

		return !!result;
	};


	/**
	 * Determine whether **list** contains a given value **target** (using `===`)
	 *
	 * @param {Array|Object} list
	 * @param {Any} target
	 * @return {Boolean}
	 */
	Collections.contains = function(list, target) {
		list = list || [];
		var found = false;

		if (Array.prototype.indexOf && list.indexOf === Array.prototype.indexOf) {
			return list.indexOf(target) !== -1;
		}
		found = Collections.some(list, function(value) {
			return value === target;
		});

		return found;
	};


	/**
	 * Safely convert anything iterable into an Array
	 * @param {Array|Object} obj
	 */
	Collections.toArray = function(obj) {
		if (!obj) {
			return [];
		}
		if (obj.length === +obj.length) {
			return Array.prototype.slice.call(obj);
		}
		return Objects.values(obj);
	};


	/**
	 * Returns the number of elements in an Object or Array
	 * @param {Array|Object} obj
	 */
	Collections.size = function(obj) {
		if (!obj) {
			return 0;
		}
		if (obj.length === +obj.length) {
			return obj.length;
		}
		return Objects.keys(obj).length;
	};


	return Collections;

});
