define(function(require) {

	var $ = require('jquery');
	var lang = require('dojo/_base/lang');
	var number = require('dojo/number');
	var date = require('dojo/date/locale');
	var forOwn = require('amd-utils/object/forOwn');
	var toArray = require('amd-utils/lang/toArray');



	var Checks = {};


	Checks.isPresent = function(value) {
		return lang.trim(value) !== '';
	};


	Checks.isDigits = function(value) {
		return !isNaN(parseInt(value, 10));
	};


	Checks.isNumber = function(value) {
		return !isNaN(number.parse(value));
	};


	Checks.isEmail = function(value) {
		return (/^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?$/i).test(value);
	};


	Checks.isUrl = function(value) {
		return (/^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i).test(value);
	};


	Checks.isDate = function(value) {

		var success = false;

		//try both 'date' and 'date and time' parsing, in that order
		$.each(['date', 'datetime'], function(i, selector) {

			//try different format lengths, in order of most likely to least likely
			$.each(['short', 'medium', 'long', 'full'], function(i, formatLength) {
				if (date.parse(value, {formatLength: formatLength, selector: selector})) {
					success = true;
					return false; //break
				}
			});
		
		});

		return success;
	
	};


	//http://en.wikipedia.org/wiki/Luhn_algorithm
	Checks.isCreditCard = function(cardNumber) {

		if (!cardNumber) {
			return false;
		}

		//allow spaces/dashes in input, but remove them
		if (cardNumber.constructor === String) {
			cardNumber = cardNumber.replace(/[\s|\-]/g, '');
		}

		var cc = +cardNumber;

		if (isNaN(cc)) {
			return false;
		}

		var digits = [];
		//extract digits in reverse order
		while (cc > 0) {
			digits.push(cc % 10);
			cc /= 10;
			cc = Math.floor(cc);
		}

		var checksum = 0;

		//sum the odd digits
		$.each(digits, function(i, digit) {
			i++; //0-based indexes
			if (i % 2 !== 0) {
				checksum += digit;
			}
		});

		//double the even digits, split into individual digits, and sum
		$.each(digits, function(i, digit) {
			i++; //0-based indexes
			if (i % 2 === 0) {
				digit *= 2;
				while (digit > 0) {
					checksum += (digit % 10);
					digit /= 10;
					digit = Math.floor(digit);
				}
			}
		});

		return checksum % 10 === 0;
	
	};


	//a wrapper for all Checks methods that always returns `true` if the value
	//is not present
	var Optional = function(value) {
		this._wrapped = value;
	};

	forOwn(Checks, function(method, key) {
		Optional.prototype[key] = function() {
			//we don't need to run the check if the value is not present
			if (!Checks.isPresent(this._wrapped)) {
				return true;
			}

			var args = toArray(arguments);
			args.unshift(this._wrapped);
			return method.call(this, args);
		};
	});


	Checks.optional = function(value) {
		return new Optional(value);
	};


	Checks.required = function(value) {
		return (value === true || Checks.isPresent(value));
	};


	return Checks;

});
