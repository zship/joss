define(function(require) {

	var declare = require('dojo/_base/declare');
	var lang = require('dojo/_base/lang');
	var ValidationError = require('./ValidationError');
	var Elements = require('joss/util/Elements');
	var forEach = require('joss/util/collection/forEach');
	var toArray = require('amd-utils/lang/toArray');
	var isFunction = require('amd-utils/lang/isFunction');
	var size = require('amd-utils/object/size');



	var Errors = declare(null, {

		constructor: function(opts) {

			this._errors = {};
			opts = lang.mixin({
				onAdd: function(){},
				onRemove: function(){}
			}, opts);
			this._onAddCallback = opts.onAdd;
			this._onRmCallback = opts.onRemove;

		},


		get: function(el, message, type) {

			if (!type) {
				type = ValidationError.ERROR;
			}

			if (message) {
				var err = new ValidationError(el, message, type);

				return [this._errors[err.hash()]] || [];
			}

			//if we were only given an element, return all errors starting with that element's hash
			var self = this;
			var ret = [];
			forEach(this._errors, function(err, key) {
				if (key.search(new RegExp('^' + Elements.hash(el) + ':')) !== -1) {
					ret.push(self._errors[key].clone());
				}
			});

			return ret;
		
		},


		addIf: function(isValid, el, message, type) {

			if (isValid === true) {
				this.remove(el, message, type);
				return -1;
			}
			else {
				this.add(el, message, type);
				return 1;
			}
		
		},


		check: function() {
			return this.addIf.apply(this, arguments);
		},


		addAny: function(el, list) {
			if (arguments.length > 2) {
				list = toArray(arguments).slice(1);
			}

			var self = this;
			forEach(list, function(item) {
				var message = item.message;
				var valid = item.valid;
				var type = item.type;

				self.addIf(valid, el, message, type);
			});
		},


		addOne: function(el, list) {

			if (arguments.length > 2) {
				list = toArray(arguments).slice(1);
			}

			var self = this;
			var addedOne = false;
			forEach(list, function(item) {
				var message = item.message;
				var valid = item.valid;
				var type = item.type;

				if (isFunction(valid)) {
					valid = valid();
				}

				if (!addedOne) {
					var result = self.addIf(valid, el, message, type);
					if (result > 0) {
						addedOne = true;
					}
				}
				else {
					self.remove(el, message, type);
				}
			});

		},


		add: function(el, message, type) {
			console.log(arguments);

			if (!type) {
				type = ValidationError.ERROR;
			}

			var err = new ValidationError(el, message, type);

			if (this._errors[err.hash()]) {
				return;
			}

			this._errors[err.hash()] = err;
			this._onAddCallback(err);
		
		},


		remove: function(el, message, type) {

			if (!type) {
				type = ValidationError.ERROR;
			}

			if (message) {
				var err = new ValidationError(el, message, type);
				var key = err.hash();

				if (!this._errors[key]) {
					return;
				}

				delete this._errors[key];
				this._onRmCallback(err);
				return;
			}

			//if we were only given an element, delete all errors starting with
			//that element's hash
			var self = this;
			forEach(this.get(el), function(err) {
				err = err.clone();
				var key = err.hash();
				delete self._errors[key]; 
				self._onRmCallback(err);
			});
		
		},


		removeAll: function(regexp) {
		
			var self = this;

			//remove everything
			if (!regexp) {
				forEach(this._errors, function(err) {
					this._onRmCallback.call(self, err);
				});
				this._errors = {};
				return;
			}

			//remove only errors matching the regexp
			forEach(this._errors, function(err, key) {
				if (key.search(regexp) !== -1) {
					this._onRmCallback.call(self, err);
					//dojo.publish('validation:remove', [err.el(), err.clone(), self.clone()]);
					delete self._errors[key];
				}
			});
		},


		size: function() {
			return size(this._errors);
		},


		clone: function() {
			return lang.clone(this);
		}

	});


	return Errors;


});
