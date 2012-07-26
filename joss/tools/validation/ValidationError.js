(function(window, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['jquery', 'joss/dojo', 'joss/util/Elements'], factory);
	} else {
		// Browser globals
		dojo.setObject('joss.tools.validation.ValidationError', factory(jQuery, dojo, joss.util.Elements));
	}
})(this, function($, dojo) {

	var ValidationError = dojo.declare(null, {

		constructor: function(el, message, type) {

			this._el = el;
			this._message = message;
			this._type = type;
		
		},

		_el: null,
		_message: '',
		_type: '',

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
			return dojo.clone(this);
		}
	
	});

	ValidationError.ERROR = 'ERROR';
	ValidationError.WARN = 'WARN';

	return ValidationError;

});
