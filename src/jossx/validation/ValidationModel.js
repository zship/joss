define(function(require) {

	var declare = require('dojo/_base/declare');
	var lang = require('dojo/_base/lang');
	var Elements = require('joss/util/Elements');
	var Objects = require('joss/util/Objects');



	var ValidationModel = declare(null, {

		constructor: function() {
			this._model = {};
		},


		_hash: function(el) {
			if (Objects.isElement(el)) {
				return Elements.hash(el);
			}

			if (Objects.isJQuery(el)) {
				return Elements.hash(el[0]);
			}

			return el;
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