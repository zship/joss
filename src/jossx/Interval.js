define(function(require) {

	var declare = require('dojo/_base/declare');
	var lang = require('dojo/_base/lang');
	var date = require('dojo/date');



	var Interval = declare(null, {


		constructor: function(opts) {

			opts = lang.mixin({
				start: new Date(),
				end: new Date()
			}, opts);

			this._start = opts.start;
			this._end = opts.end;
		
		},


		_start: null,
		_end: null,


		start: function(val) {
			if (val) {
				this._start = val;
				return this;
			}
			return this._start;
		},


		end: function(val) {
			if (val) {
				this._end = val;
				return this;
			}
			return this._end;
		}

	
	});


	//static methods
	Interval.TODAY = function() {
		var from = new Date();
		from.setSeconds(0);
		from.setMilliseconds(0);
		from.setMinutes(0);
		from.setHours(0);

		var to = new Date();

		return new Interval({start: from, end: to});
	};

	Interval.YESTERDAY = function() {
		var from = new Date();
		from.setTime(from.getTime() - 1000*60*60*24);
		from.setSeconds(0);
		from.setMilliseconds(0);
		from.setMinutes(0);
		from.setHours(0);

		var to = lang.clone(from);
		to.setSeconds(59);
		to.setMilliseconds(999);
		to.setMinutes(59);
		to.setHours(23);

		return new Interval({start: from, end: to});
	};

	Interval.WEEK_TO_DATE = function() {
		var from = new Date();
		var to = new Date();
		//the beginning of the week is day 0.  the current time minus the time
		//elapsed since day 0 gives the time at day 0
		from.setTime(from.getTime() - from.getDay() * 1000*60*60*24);
		from.setSeconds(0);
		from.setMilliseconds(0);
		from.setMinutes(0);
		from.setHours(0);

		return new Interval({start: from, end: to});
	};

	Interval.LAST_WEEK = function() {
		var today = new Date();
		today.setSeconds(0);
		today.setMilliseconds(0);
		today.setMinutes(0);
		today.setHours(0);

		var n = today.getDay();

		var from = new Date(today.getTime() - (n+7) * 1000*60*60*24);

		var to = new Date(today.getTime() - (n+1) * 1000*60*60*24);
		to.setSeconds(59);
		to.setMilliseconds(999);
		to.setMinutes(59);
		to.setHours(23);

		return new Interval({start: from, end: to});
	};

	Interval.MONTH_TO_DATE = function() {
		var from = new Date();
		from.setSeconds(0);
		from.setMilliseconds(0);
		from.setMinutes(0);
		from.setHours(0);
		from.setDate(1);

		var to = new Date();

		return new Interval({start: from, end: to});
	};

	Interval.LAST_MONTH = function() {
		var now = new Date();
		var month = now.getMonth() - 1;
		var year = now.getFullYear();
		if (month < 0) {
			month = 11;
			year -= 1;
		}

		var from = new Date();
		from.setSeconds(0);
		from.setMilliseconds(0);
		from.setMinutes(0);
		from.setHours(0);
		from.setMonth(month);
		from.setFullYear(year);
		from.setDate(1);

		var to = new Date();
		to.setSeconds(59);
		to.setMilliseconds(999);
		to.setMinutes(59);
		to.setHours(23);
		to.setMonth(month);
		to.setFullYear(year);
		to.setDate( date.getDaysInMonth(from) );

		return new Interval({start: from, end: to});
	};

	Interval.YEAR_TO_DATE = function() {
		var from = new Date();
		from.setSeconds(0);
		from.setMilliseconds(0);
		from.setMinutes(0);
		from.setHours(0);
		from.setMonth(0);
		from.setDate(1);

		var to = new Date();

		return new Interval({start: from, end: to});
	};

	Interval.LAST_YEAR = function() {
		var now = new Date();
		var year = now.getFullYear() - 1;

		var from = new Date();
		from.setSeconds(0);
		from.setMilliseconds(0);
		from.setMinutes(0);
		from.setHours(0);
		from.setMonth(0);
		from.setFullYear(year);
		from.setDate(1);

		var to = new Date();
		to.setSeconds(59);
		to.setMilliseconds(999);
		to.setMinutes(59);
		to.setHours(23);
		to.setMonth(11);
		to.setFullYear(year);
		to.setDate( date.getDaysInMonth(to) );

		return new Interval({start: from, end: to});
	};

	Interval.ALL_TIME = function() {
		var from = new Date(0);
		var to = new Date();
		return new Interval({start: from, end: to});
	};


	return Interval;


});
