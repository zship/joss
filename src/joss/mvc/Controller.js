define(function(require) {

	var $ = require('jquery');
	var Classes = require('joss/oop/Classes');
	var Lifecycle = require('joss/oop/Lifecycle');
	var lang = require('dojo/_base/lang');
	var hub = require('dojo/topic');
	var Objects = {};
	Objects.methods = require('joss/util/object/methods');
	var Elements = require('joss/util/Elements');
	var forEach = require('amd-utils/collection/forEach');


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


	var Controller = Classes.create(Lifecycle, /** @lends joss/mvc/Controller.prototype */ {

		'-chains-': {
			destroy: 'before'
		},


		/**
		 * @class Controller
		 * @param {Object|jQuery|Element} opts
		 * @constructs
		 */
		constructor: function(opts) {

			this._data = {};

			opts = lang.mixin({
				root: null
			}, opts);

			//useful for off-screen rendering
			if (!opts.root) {
				this.$root = $('<div></div>');
			}
			else {
				this.root = opts.root;
			}

			//store a reference to the controller in the root element
			this.$root.data('controller', this);
			this._bindings = {};

		},


		/**
		 * Call joss/mvc/Controller#stop and then remove the Controller's
		 * root element.
		 */
		destroy: function() {
			this.stop().then(function() {
				this.$root.empty();
			}.bind(this));
		},


		start: function() {
			this.bind();
		},


		stop: function() {
			this.unbind();
		},


		_setRoot: function(el) {
			el = Elements.fromAny(el);

			if (el === this._root) {
				return this;
			}

			this.unbind();

			this._data.root = el;
			this._data.$root = $(el);

			if (this.isRunning()) {
				this.bind();
			}
		},


		/** @type {Element} */
		root: null,


		'set root': function(el) {
			this._setRoot(el);
		},


		/** @type {jQuery} */
		$root: null,


		'set $root': function(el) {
			this._setRoot(el);
		},


		/**
		 * Replace the contents of `this.root` with **val**
		 * @param {String} val
		 * @return {joss/mvc/Controller} this
		 */
		contents: function(val) {
			this.$root.empty().append(val);
			return this;
		},


		/**
		 * Handle methods matching particular patterns as events.  This allows
		 * us to guarantee proper unbinding when {joss/mvc/Controller#stop} is
		 * called.
		 * @return {joss/mvc/Controller} this
		 */
		bind: function() {

			var methods = Objects.methods(this);

			//check for event data (denoted with " _data" at the end of the
			//method name) before binding events, and include that data in the
			//bindings if present
			var eventData = {};
			methods.forEach(function(key) {

				var method = this[key];
				var match = rEventData.exec(key);
				if (match === null) {
					return true; //continue
				}
				eventData[lang.trim(match[1])] = method;
				return true;
			
			}.bind(this));

			//loop through this controller's methods, looking for keys that
			//match the patterns defined at the top of this file
			methods.forEach(function(key) {

				var method = this[key];

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
						obj = this.root;
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
				this.$root.on(eventName, selector, eventData[key], handler);

				this._bindings[key] = {
					type: 'delegate',
					root: this.$root,
					selector: selector,
					eventName: eventName,
					handler: handler
				};
			
			}.bind(this));

			return this;
		
		},


		/**
		 * Unbind all events previously bound with {joss/mvc/Controller#bind}.
		 * @return {joss/mvc/Controller} this
		 */
		unbind: function() {
			forEach(this._bindings, function(binding) {
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
		 * @return {joss/mvc/Controller} this
		 */
		rebind: function() {
			//only unbind events that could possibly have become detached:
			//those outside this.root or bound without delegation
			var toDelete = [];
			forEach(this._bindings, function(binding, key) {
				if (binding.type === 'bind') {
					$(binding.selector).off(binding.eventName, binding.handler);
					toDelete.push(key);
				}
				else if (binding.type === 'delegateOutside') {
					binding.root.off(binding.eventName, binding.selector, binding.handler);
					toDelete.push(key);
				}
			});
			forEach(toDelete, function(key) {
				delete this._bindings[key];
			});
			this.bind();
		}

	});


	$.fn.controller = function() {
		return this.data('controller');
	};


	return Controller;

});
