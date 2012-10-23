/*
 * Static utility methods dealing with Deferred objects
 */
define(function(require) {

	var $ = require('jquery');
	var lang = require('dojo/_base/lang');

	var Deferreds = {

		//modified from the excellent jquery.waterfall plugin:
		//https://github.com/dio-el-claire/jquery.waterfall
		//Runs all passed functions in order, passing results to the next
		//function in the series. Returns $.Deferred object.
		series: function() {
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
		},


		parallel: function() {
			return $.when.apply(this, arguments);
		}

	};

	return Deferreds;

});
