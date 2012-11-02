define(function(require) {

	var lang = require('dojo/_base/lang');
	var Elements = require('joss/util/Elements');
	var Classes = require('joss/util/Classes');


	
	var ValidationError = Classes.getset(['el', 'message', 'type'], null, {

		constructor: function(el, message, type) {

			this.el(el);
			this.message(message);
			this.type(type);
		
		},


		_setType: function(val) {
			this._type = val || ValidationError.ERROR;
		},


		hash: function() {
			return Elements.hash(this._el) + ':' + this._message + ':' + this._type;
		},


		clone: function() {
			return lang.clone(this);
		}
	
	});

	ValidationError.ERROR = 'ERROR';
	ValidationError.WARN = 'WARN';

	return ValidationError;

});
