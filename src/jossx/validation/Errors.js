define(function(require) {

	var $ = require('jquery');
	var declare = require('dojo/_base/declare');
	var lang = require('dojo/_base/lang');
	var ValidationError = require('./ValidationError');
	var Elements = require('joss/util/Elements');
	var forEach = require('joss/util/collection/forEach');
	var map = require('joss/util/collection/map');
	var toArray = require('amd-utils/lang/toArray');
	var isFunction = require('amd-utils/lang/isFunction');
	var size = require('amd-utils/object/size');
	var Deferreds = {
		anyToDeferred: require('deferreds/anyToDeferred'),
		map: require('deferreds/map'),
		mapSeries: require('deferreds/mapSeries'),
		forEach: require('deferreds/forEach'),
		forEachSeries: require('deferreds/forEachSeries')
	};



	var Errors = declare(null, {

		constructor: function(opts) {

			this._errors = {};
			opts = lang.mixin({
				onAdd: function(){},
				onRemove: function(){}
			}, opts);
			this._onAddCallback = opts.onAdd;
			this._onRmCallback = opts.onRemove;

			this._pending = {};

		},


		get: function(el, message, type) {

			if (message) {
				var err = new ValidationError(el, message, type);
				var existing = this._errors[err.hash()];
				return existing ? [existing] : [];
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

			var err = new ValidationError(el, message, type);
			if (this._pending[err.hash()]) {
				return;
			}

			this._pending[err.hash()] = true;

			var self = this;
			return Deferreds.anyToDeferred(isValid)
			.done(function(value) {
				if (value === true || value === 'true') {
					self.remove(el, message, type);
				}
				else {
					self.add(el, message, type);
				}
			})
			.always(function() {
				self._pending[err.hash()] = false;
			});

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
				self.addIf(item.test, el, item.message, item.type);
			});

		},


		addOne: function(el, list) {

			if (arguments.length > 2) {
				list = toArray(arguments).slice(1);
			}

			var self = this;
			Deferreds.forEachSeries(list, function(item, index) {
				var deferred = $.Deferred();

				var err = new ValidationError(el, item.message, item.type);
				if (self._pending[err.hash()]) {
					deferred.resolve(); //continue
					return deferred;
				}

				self._pending[err.hash()] = true;

				Deferreds.anyToDeferred(item.test)
				.done(function(isValid) {

					var i;
					//check if addOne() was called while the deferred was
					//running, and if it generated an error higher in the chain
					for (i = 0; i < index; i++) {
						var higherItem = list[i];
						//if so, that event removed errors lower in the chain. we can just break.
						if (self.get(el, higherItem.message, higherItem.type).length) {
							deferred.reject();
							return;
						}
					}
					
					//if the test passed, remove a possibly-existing error in this spot
					if (isValid === true || isValid === 'true'){
						self.remove(el, item.message, item.type);
						deferred.resolve(); //continue
						return;
					}

					//otherwise, upon the first failed test add the error
					self.add(el, item.message, item.type);
					
					//and remove everything in the list below this item
					for (i = index + 1; i < list.length; i++) {
						var lowerItem = list[i];
						self.remove(el, lowerItem.message, lowerItem.type);
					}

					deferred.reject(); //break
				})
				.always(function() {
					self._pending[err.hash()] = false;
				});

				return deferred.promise();
			});

		},


		add: function(el, message, type) {

			var err = new ValidationError(el, message, type);

			if (this._errors[err.hash()]) {
				return;
			}

			this._errors[err.hash()] = err;
			this._onAddCallback(err);
		
		},


		remove: function(el, message, type) {

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
