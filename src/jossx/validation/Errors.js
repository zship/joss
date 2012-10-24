define(function(require) {

	var $ = require('jquery');
	var declare = require('dojo/_base/declare');
	var lang = require('dojo/_base/lang');
	var ValidationError = require('./ValidationError');



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
			$.each(this._errors, function(key, err) {
				if (key.search(new RegExp('^' + $(el).hash() + ':')) !== -1) {
					ret.push(self._errors[key].clone());
				}
			});

			return ret;
		
		},


		check: function(isValid, el, message, type) {

			if (isValid === true) {
				this.remove(el, message, type);
				return -1;
			}
			else {
				this.add(el, message, type);
				return 1;
			}
		
		},


		add: function(el, message, type) {
			//console.log('add called: ', el, message);

			if (!type) {
				type = ValidationError.ERROR;
			}

			var err = new ValidationError(el, message, type);

			if (this._errors[err.hash()]) {
				return;
			}

			this._errors[err.hash()] = err;
			this._onAddCallback(err);
			//dojo.publish('validation:add', [err.el(), err, this.clone()]);
		
		},


		remove: function(el, message, type) {
			//console.log('remove called: ', el, message);

			if (!type) {
				type = ValidationError.ERROR;
			}

			if (message) {
				var err = new ValidationError(el, message, type);
				//console.log('remove by message: ', el, message);
				//console.log(this._errors);
				
				var key = err.hash();

				if (!this._errors[key]) {
					return;
				}

				delete this._errors[key];
				this._onRmCallback(err);
				//dojo.publish('validation:remove', [err.el(), err, this.clone()]);

				return;
			}

			//if we were only given an element, delete all errors starting with
			//that element's hash
			var self = this;
			$.each(this.get(el), function(i, err) {
				//console.log('removed by el: ', el, message);
				err = err.clone();
				var key = err.hash();
				delete self._errors[key]; 
				this._onRmCallback(err);
				//dojo.publish('validation:remove', [err.el(), err.clone(), self.clone()]);
			}.bind(this));
		
		},


		removeAll: function(regexp) {
			//console.log('removeAll called: ', regexp);
		
			var self = this;

			//remove everything
			if (!regexp) {
				$.each(this._errors, function(key, err) {
					this._onRmCallback.call(self, err);
					//dojo.publish('validation:remove', [err.el(), err.clone(), self.clone()]);
				});
				this._errors = {};
				return;
			}

			//remove only errors matching the regexp
			$.each(this._errors, function(key, err) {
				if (key.search(regexp) !== -1) {
					this._onRmCallback.call(self, err);
					//dojo.publish('validation:remove', [err.el(), err.clone(), self.clone()]);
					delete self._errors[key];
				}
			});
		},


		size: function() {
		
			var count = 0;
			$.each(this._errors, function(i, val) {
				count++;
			});
			return count;
		
		},


		clone: function() {
			return lang.clone(this);
		}

	});


	return Errors;


});
