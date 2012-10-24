define(function(require) {

	var $ = require('jquery');
	var declare = require('dojo/_base/declare');
	var lang = require('dojo/_base/lang');
	require('joss/util/Elements');


	var ValidationError = declare(null, {

		constructor: function(el, message, type) {

			this._el = el;
			this._message = message;
			this._type = type;
		
		},


		el: function(val) {
			if (val) { this._el = val; return this; }
			return this._el;
		},


		message: function(val) {
			if (val) { this._message = val; return this; }
			return this._message;
		},


		type: function(val) {
			if (val) { this._type = val; return this; }
			return this._type;
		},


		hash: function() {
			return $(this._el).hash() + ':' + this._message + ':' + this._type;
		},


		clone: function() {
			return lang.clone(this);
		}
	
	});

	ValidationError.ERROR = 'ERROR';
	ValidationError.WARN = 'WARN';

	return ValidationError;

});
