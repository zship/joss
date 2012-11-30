define(function(require) {

	var Classes = require('joss/util/Classes');
	var lang = require('dojo/_base/lang');
	var Elements = require('joss/util/Elements');



	var ValidationModel = Classes.create(/** @lends jossx/validation/ValidationModel.prototype */ {

		constructor: function() {
			this._model = {};
		},


		_hash: function(el) {
			if (!isNaN(parseInt(el, 10))) {
				return el;
			}

			el = Elements.fromAny(el);
			return Elements.hash(el);
		},


		get: function(el) {
			var hash = this._hash(el);
			return this._model[hash];
		},


		set: function(el, value) {
			var hash = this._hash(el);
			this._model[hash] = value;
		},


		clone: function() {
			var model = new ValidationModel();
			model._model = lang.clone(this._model);
			return model;
		}

	});


	return ValidationModel;

});
