define(function(require) {

	var $ = require('jquery');
	var declare = require('dojo/_base/declare');
	var lang = require('dojo/_base/lang');
	var hub = require('dojo/topic');
	var waterfall = require('deferreds/waterfall');
	var Objects = {};
	Objects.methods = require('joss/util/object/methods');



	//object:create
	var rPubsub = /^\S*:\S*$/;
	//input[type="text"] click
	//body > #container > div.child keyup
	var rEvent = /^(.*)\s([a-z]*)$/;
	//{window} resize
	//{root} mouseenter
	var rSpecialEvent = /^\{(.*)\}\s*(.*)$/;
	//input[type="text"] click _data
	//body > #container > div.child keyup _data
	var rEventData = /^(.*\s[a-z]*?)\s*_data/;


	var Controller = declare(null, /** @lends joss.mvc.Controller.prototype */ {

		'-chains-': {
			destroy: 'before',
			render: 'before'
		},


		/**
		 * @class Controller
		 * @param {Object|jQuery|Element} opts
		 * @constructs
		 */
		constructor: function(opts) {

			if (opts && opts.constructor === $) {
				this.root = opts;
			}
			else {
				opts = lang.mixin({
					root: null
				}, opts);

				//useful for off-screen rendering
				if (!opts.root) {
					opts.root = $('<div></div>');
				}

				this.root = opts.root;
			}


			this._bindings = {};
			//store a reference to the controller in the root element
			this.root.data('controller', this);
			this._chainLifecycleMethods();

		},


		/**
		 * Call joss.mvc.Controller#stop and then remove the Controller's
		 * root element.
		 */
		destroy: function() {
			this.stop().then(lang.hitch(this, function() {
				this.root.empty();
			}));
		},


		/**
		 * Lifecycle method. Calls are automatically chained in order from
		 * superclass (joss.mvc.Controller) to subclass (your controller).
		 */
		start: function() {
			this.bind();
		},


		/**
		 * Lifecycle method. Calls are automatically chained in order from
		 * subclass (your controller) to superclass (joss.mvc.Controller).
		 */
		stop: function() {
			this.unbind();
		},


		/**
		 * Replace the inner HTML of `this.root` with **val**
		 * @param {String} val
		 * @return {joss.mvc.Controller} this
		 */
		html: function(val) {
			this.root.empty().append(val);
			return this;
		},


		/**
		 * Handle methods matching particular patterns as events.  This allows
		 * us to guarantee proper unbinding when joss.mvc.Controller#stop is
		 * called.
		 * @return {joss.mvc.Controller} this
		 */
		bind: function() {

			var methods = Objects.methods(this);

			//check for event data (denoted with " _data" at the end of the
			//method name) before binding events, and include that data in the
			//bindings if present
			var eventData = {};
			$.each(methods, lang.hitch(this, function(key, data) {

				var match = rEventData.exec(key);
				if (match === null) {
					return true; //continue
				}
				eventData[lang.trim(match[1])] = data;
			
			}));

			//loop through this controller's methods, looking for keys that
			//match the patterns defined at the top of this file
			$.each(methods, lang.hitch(this, function(key, method) {

				//don't bind the same selector more than once (for calls to
				//rebind() or multiple calls to bind())
				if (this._bindings[key]) {
					return true; //continue;
				}

				//treat pubsub events separately, as performance
				//is many times greater than standard browser events
				if (rPubsub.test(key) === true) {
					var handle = hub.subscribe(key, lang.hitch(this, function() {
						method.apply(this, arguments);
					}));
					this._bindings[key] = {
						type: 'pubsub',
						handle: handle 
					};

					return true; //continue
				}

				//regular browser events
				var match = key.match(rEvent);
				if (match === null) {
					return true; //continue
				}
				var selector = match[1];
				var eventName = match[2];

				//console.log(key, "'" + selector + "'", "'" + eventName + "'");
				
				//make an event handler that will execute in this Controller's
				//context
				var handler = lang.hitch(this, function(ev) {
					//pass along any other arguments (special event plugins)
					var args = [].slice.call(arguments, 1);
					//the event and target go up front
					args.unshift(ev, ev.currentTarget);
					return method.apply(this, args);
				});

				//allow binding to object references or elements outside of
				//this.root
				if ((match = selector.match(rSpecialEvent)) !== null) {
					var target = match[1];
					var subSelector = match[2];
					var obj;

					//special case: binding to this controller's root element
					if (target === 'root') {
						obj = this.root[0];
					}
					//bind to a property of this controller
					else if (lang.getObject(target, false, this)) {
						obj = lang.getObject(target, false, this);
					}
					//bind to a global element (window, document)
					else if (lang.getObject(target)) {
						obj = lang.getObject(target);
					}
					//bind to a selector string, but make it the delegation
					//target instead of this.root
					else {
						obj = target;
					}

					if (!obj) {
						return true; //continue
					}

					//is there any more to the selector string?
					//"{_element} .child click", for instance, should delegate
					//clicks on ".child" to {_element}
					if (subSelector) {
						$(obj).on(eventName, subSelector, eventData[key], handler);

						this._bindings[key] = {
							type: 'delegateOutside',
							root: obj,
							selector: subSelector,
							eventName: eventName,
							handler: handler
						};
					}
					else {
						$(obj).on(eventName, eventData[key], handler);

						this._bindings[key] = {
							type: 'bind',
							selector: obj,
							eventName: eventName,
							handler: handler
						};
					}

					return true; //continue
				}

				//for everything else, use event delegation with this.root as
				//the delegation target for performance and versatility
				this.root.on(eventName, selector, eventData[key], handler);

				this._bindings[key] = {
					type: 'delegate',
					root: this.root,
					selector: selector,
					eventName: eventName,
					handler: handler
				};
			
			}));

			return this;
		
		},


		/**
		 * Unbind all events previously bound with joss.mvc.Controller#bind.
		 * @return {joss.mvc.Controller} this
		 */
		unbind: function() {
			$.each(this._bindings, function(key, binding) {
				if (binding.type === 'pubsub') {
					hub.unsubscribe(binding.handle);
				}
				else if (binding.type === 'bind') {
					$(binding.selector).off(binding.eventName, binding.handler);
				}
				else {
					binding.root.off(binding.eventName, binding.selector, binding.handler);
				}
			});

			this._bindings = {};
		},


		/**
		 * Re-bind only those events which do not delegate to this Controller's
		 * root element (as their delegation targets may have changed).
		 * @return {joss.mvc.Controller} this
		 */
		rebind: function() {
			//only unbind events that could possibly have become detached:
			//those outside this.root or bound without delegation
			var toDelete = [];
			$.each(this._bindings, function(key, binding) {
				if (binding.type === 'bind') {
					$(binding.selector).off(binding.eventName, binding.handler);
					toDelete.push(key);
				}
				else if (binding.type === 'delegateOutside') {
					binding.root.off(binding.eventName, binding.selector, binding.handler);
					toDelete.push(key);
				}
			});
			$.each(toDelete, function(i, key) {
				delete this._bindings[key];
			});
			this.bind();
		},


		//perform special chaining which can wait for Deferred objects in the
		//chain to complete
		_chainLifecycleMethods: function() {
			var chains = {
				'start': 'after',
				'stop': 'before'
			};

			var bases = this.constructor._meta.bases;

			$.each(chains, lang.hitch(this, function(key, val) {
				var i = 0;
				var step = 1;
				var methodList = [];

				if (val === 'after'){
					i = bases.length - 1;
					step = -1;
				}

				for (; !!bases[i]; i+=step) {
					var base = bases[i];
					var method = (base._meta ? base._meta.hidden : base.prototype)[key];
					if (method) {
						methodList.push(method);
					}
				}

				this[key] = lang.hitch(this, function() {
					var args = [].slice.apply(arguments);
					var list = lang.clone(methodList);
					if (args.length) {
						list.unshift(args);
					}
					return waterfall.apply(this, list);
				});
			}));
		}
	
	});


	$.fn.controller = function() {
		return this.data('controller');
	};


	return Controller;

});
