(function(window, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['jquery', 'joss/dojo', 'joss/mvc/Controller', 'joss/tools/validation/Errors', 'joss/util/Elements', 'joss/util/Forms'], factory);
	} else {
		// Browser globals
		dojo.setObject('joss.tools.validation.ValidatingController', factory(jQuery, dojo, joss.mvc.Controller, joss.tools.validation.Errors, joss.util.Elements, joss.util.Forms));
	}
})(this, function($, dojo, Controller, Errors, Elements, Forms) {

	return dojo.declare(Controller, {

		constructor: function() {

			this._validationQueue = {};
			this._validationModel = {};
			var self = this;
			this._validationErrors = new Errors({
				onAdd: function(err) {
					self['validation:add'](err.el(), err.clone(), self._validationErrors.clone());
				},
				onRemove: function(err) {
					self['validation:remove'](err.el(), err.clone(), self._validationErrors.clone());
				}
			});

			//console.log(this);
		
		},


		destroy: function() {

			delete this._validationQueue;
			delete this._validationModel;
			delete this._validationErrors;
		
		},


		_validationQueue: null,
		_validationModel: null,
		_validationErrors: null,


		'input[type="text"] keyup': function(ev, tgt) {
			if (!this.debouncedValidationKeyup) {

				this.debouncedValidationKeyup = $.debounce(function(ev, tgt) {

					if ($(tgt).val() === $(tgt).data('oldValue')) {
						return;
					}
					$(tgt).data('oldValue', $(tgt).val());
					this._queueField(tgt);
				
				}, 300);

			}

			this.debouncedValidationKeyup(ev, tgt);

		},


		'input[type="radio"], select change': function(ev, tgt) {
			$(tgt).data('firstChange', false);
			this._queueField(tgt);
		},


		'input blur': function(ev, tgt) {
			if ($(tgt).val() !== '') {
				$(tgt).data('firstChange', false);
			}

			this._queueField(tgt);
		},


		//allow events to queue up validation requests as fast as necessary,
		//and overwrite duplicate requests before calling the actual validation
		//method
		_queueField: function(tgt) {

			if ($(tgt).data('firstChange') !== false) {
				return;
			}
			
			this._validationQueue[$(tgt).hash()] = tgt;
			this._processValidationQueue();
		
		},

		
		_processValidationQueue: function() {

			if (!this._throttledProcessValidationQueue) {

				this._throttledProcessValidationQueue = $.throttle(function() {
					//console.log(this);

					//console.log('validate: ', tgt.name, Forms.val(tgt), $(tgt).data('firstChange'));

					//clone the validationQueue and clear it immediately so the queue
					//can continue to be built while this method runs
					var queue = {};
					if (this._validationQueue) {
						$.each(this._validationQueue, function(hash, tgt) {
							queue[hash] = tgt;
						});
					}
					this._validationQueue = {};

					$.each(queue, dojo.hitch(this, function(hash, tgt) {

						//_validationModel represents the form's inputs for which a user has
						//had the chance to enter a value
						this._validationModel[hash] = Forms.val(tgt);

						//validation:check mutates our _validationErrors object.
						//the Errors class will publish events on successful add() or remove() calls,
						//which should be listened to by subclasses of ValidatingController
						this['validation:check'](tgt, this._validationModel[hash], this._validationErrors, dojo.clone(this._validationModel));
					
					}));
				
				}, 500);

			}

			this._throttledProcessValidationQueue();
		
		},


		//validate all fields, or just the fields under el
		validate: function(el) {

			var inputs;
			var isFullCheck = !el;

			if (!el) {
				inputs = this.root().find('input, select');
			}
			else {
				inputs = el.find('input, select');
			}

			var self = this; 
			inputs.each(function() {
				//make all fields eligible for event-based validation
				$(this).data('firstChange', false);

				//fully populate the model
				self._validationModel[$(this).hash()] = Forms.val(this);
			});

			//with the full model, run validation:check on everything
			var model = dojo.clone(this._validationModel);

			//for a full check, go the faster route of running against the
			//validationErrors object
			if (isFullCheck) {
				inputs.each(function() {
					self['validation:check'](this, model[$(this).hash()], self._validationErrors, model);
				});
				return self._validationErrors.size() === 0;
			}

			//for partial checks, we'll run twice: once against a new errors
			//object solely to obtain a count unique to this subset of the form
			//(under {el}), and also against the main _validationErrors which
			//has callbacks set to notify validation:add and validation:remove
			var errors = new Errors();
			inputs.each(function() {

				self['validation:check'](this, model[$(this).hash()], errors, model);
				self['validation:check'](this, model[$(this).hash()], self._validationErrors, model);
			
			});

			return errors.size() === 0;
		
		}


	});

});
