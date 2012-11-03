define(function(require) {

	var $ = require('jquery');
	var declare = require('dojo/_base/declare');
	var lang = require('dojo/_base/lang');
	var Controller = require('joss/mvc/Controller');
	var Errors = require('./Errors');
	var ValidationModel = require('./ValidationModel');
	var Forms = require('joss/util/Forms');
	var Elements = require('joss/util/Elements');
	var Functions = require('joss/util/Functions');
	var objectSize = require('amd-utils/object/size');
	var objectKeys = require('amd-utils/object/keys');
	require('jquery.event.input');



	var Validator = declare(Controller, {

		constructor: function(opts) {

			var self = this;

			opts = lang.mixin({
				check: null, //function(el, value, errors, model)
				add: null, //function(el, added, errors)
				remove: null //function(el, removed, errors)
			}, opts);

			//if subclassing, allow callbacks to be defined as members of the subclass
			this._onValidationCheck = opts.check || this['validation.check'];
			this._onValidationAdd = opts.add || this['validation.add'];
			this._onValidationRemove = opts.remove || this['validation.remove'];

			this._validationQueue = {};
			this._validationModel = new ValidationModel();
			this._validationErrors = new Errors({
				onAdd: function(err) {
					self._onValidationAdd(err.el(), err.clone(), self._validationErrors.clone());
				},
				onRemove: function(err) {
					self._onValidationRemove(err.el(), err.clone(), self._validationErrors.clone());
				}
			});
		
		},


		destroy: function() {

			delete this._validationQueue;
			delete this._validationModel;
			delete this._validationErrors;
		
		},


		//normal entry (detect when values actually change)
		'input[type="password"], input[type="text"], textarea input': function(ev, tgt) {
			this._queueField(tgt);
		},


		//browser autofill
		'input[type="password"], input[type="text"], textarea change': function(ev, tgt) {
			this._queueField(tgt);
		},


		'input[type="radio"], select change': function(ev, tgt) {
			$(tgt).data('validation.firstChange', false);
			this._queueField(tgt);
		},


		//a completed attempt to enter a value
		'input[type="password"], input[type="text"], textarea blur': function(ev, tgt) {
			if (Forms.val(tgt) === '') {
				return;
			}

			if ($(tgt).data('validation.firstChange') !== false) {
				$(tgt).data('validation.firstChange', false);
			}
			this._queueField(tgt);
		},


		//allow events to queue up validation requests as fast as necessary,
		//and overwrite duplicate requests before calling the actual validation
		//method
		_queueField: function(tgt) {

			if ($(tgt).data('validation.firstChange') !== false) {
				return;
			}
			
			this._validationQueue[Elements.hash(tgt)] = tgt;
			this._processValidationQueue();
		
		},


		_processValidationQueue: Functions.throttle(function() {
			
			//clone the validationQueue and clear it immediately so the queue
			//can continue to be built while this method runs
			var queue = {};
			var keys = objectKeys(this._validationQueue);
			var size = objectSize(this._validationQueue);
			var i;

			for (i = 0; i < size; i++) {
				queue[keys[i]] = this._validationQueue[keys[i]];
			}
			this._validationQueue = {};

			for (i = 0; i < size; i++) {
				var hash = keys[i];
				var tgt = queue[hash];

				//_validationModel represents the form's inputs for which a user has
				//had the chance to enter a value
				this._validationModel.set(hash, Forms.val(tgt));

				//_onValidationCheck mutates our _validationErrors object.
				//the Errors class will publish events on successful add() or remove() calls,
				//which should be listened to by subclasses of ValidatingController
				this._onValidationCheck(tgt, this._validationModel.get(hash), this._validationErrors, this._validationModel.clone());
			}

		}, 500),


		//validate all fields, or just the fields under el
		validate: function(el) {

			var inputs;
			var isFullCheck = !el;

			if (!el) {
				inputs = this.$root.find('input, textarea, select');
			}
			else {
				inputs = el.find('input, textarea, select');
			}

			inputs = inputs.filter(':visible:enabled');

			var self = this;
			inputs.each(function() {
				//make all fields eligible for event-based validation
				$(this).data('validation.firstChange', false);

				//fully populate the model
				self._validationModel.set(this, Forms.val(this));
			});

			//with the full model, run _onValidationCheck on everything
			var model = this._validationModel.clone();

			//for a full check, go the faster route of running against the
			//validationErrors object
			if (isFullCheck) {
				inputs.each(function() {
					self._onValidationCheck(this, model.get(this), self._validationErrors, model);
				});
				return self._validationErrors.size() === 0;
			}

			//for partial checks, we'll run twice: once against a new errors
			//object solely to obtain a count unique to this subset of the form
			//(under {el}), and also against the main _validationErrors which
			//has callbacks set to notify validation:add and validation:remove
			var errors = new Errors();
			inputs.each(function() {

				self._onValidationCheck(this, model.get(this), errors, model);
				self._onValidationCheck(this, model.get(this), self._validationErrors, model);
			
			});

			return errors.size() === 0;
		
		}

	});


	return Validator;

});
