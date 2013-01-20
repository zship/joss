define(function(require) {

	var Elements = require('joss/util/Elements');
	var Class = require('class/Class');


	var ValidationError = Class.extend({

		'-accessors-': ['el', 'message', 'type'],

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
			return new ValidationError(this._el, this._message, this._type);
		},

		toString: function() {
			return this.hash();
		}
	
	});

	ValidationError.ERROR = 'ERROR';
	ValidationError.WARN = 'WARN';

	return ValidationError;

});
