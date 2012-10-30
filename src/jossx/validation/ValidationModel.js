define(function(require) {

	var $ = require('jquery');
	var declare = require('dojo/_base/declare');
	var lang = require('dojo/_base/lang');
	var Elements = require('joss/util/Elements');
	var isElement = require('joss/util/lang/isElement');
	var objectIs = require('joss/util/lang/is');



	var ValidationModel = declare(null, {

		constructor: function() {
			this._model = {};
		},


		_hash: function(el) {
			if (isElement(el)) {
				return Elements.hash(el);
			}

			if (objectIs(el, $)) {
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
