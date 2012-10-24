define(function(require) {

	var $ = require('jquery');
	var declare = require('dojo/_base/declare');
	var lang = require('dojo/_base/lang');
	var hub = require('dojo/topic');
	var Deferreds = require('joss/util/Deferreds');



	$.fn.controller = function() {
		return this.data("controller");
	};

	//object:create
	var pubsubMatcher = /^\S*:\S*$/;
	//input[type="text"] click
	//body > #container > div.child keyup
	var eventSplitter = /^(.*)\s([a-z]*)$/;
	//{window} resize
	//{root} mouseenter
	var objectSplitter = /^\{(.*)\}\s*(.*)$/;
	//input[type="text"] click _data
	//body > #container > div.child keyup _data
	var eventDataSplitter = /^(.*\s[a-z]*?)\s*_data/;

	return declare(null, {

		'-chains-': {
			destroy: 'before',
			render: 'before'
		},

		constructor: function(opts) {

			if (opts && opts.constructor === $) {
				this._root = opts;
			}
			else {
				opts = lang.mixin({
					root: $('body'),
					view: null
				}, opts);

				this._root = opts.root;
				this._view = opts.view;
			}

			//store a reference to the controller in the root element
			this._root.data("controller", this);
			this._bindings = [];
			this._chainLifecycleMethods();

		},


		destroy: function() {
			this.stop().then(lang.hitch(this, function() {
				this.root().empty();
			}));
		},


		start: function() {
			this.bind();
		},


		stop: function() {
			this.unbind();
		},


		root: function() {
			return this._root;
		},


		/*
		 * Abstract method to be called whenever
		 * the controller should be updated
		 */
		render: function() {},


		html: function(val) {
			this.root().empty().append(val);
			return this;
		},


		/*
		 * Handle methods matching particular patterns
		 * as events.  This allows us to guarantee proper
		 * unbinding.
		 */
		bind: function() {

			//check for event data before binding events, and include that data
			//in the bindings if present
			var eventData = {};
			$.each(this, lang.hitch(this, function(key, data) {

				var match = eventDataSplitter.exec(key);
				if (match === null) {
					return true; //continue
				}
				eventData[lang.trim(match[1])] = data;
			
			}));

			//console.log(eventData);

			this._bindings = this._bindings || [];

			//var methodList = {};

			//pre-run to process comma-separated bindings
			/*
			 *$.each(this, function(key, method) {
			 *    if (key.search(/,/) !== -1) {
			 *        $.each(key.split(','), function(i, subkey) {
			 *            methodList[lang.trim(subkey)] = method;
			 *        });
			 *    }
			 *    else {
			 *        methodList[key] = method;
			 *    }
			 *});
			 */

			//loop through this controller's methods,
			//looking for keys that match the patterns
			//defined at the top of this file
			$.each(this, lang.hitch(this, function(key, method) {

				//treat pubsub events separately, as performance
				//is many times greater than standard browser events
				if (pubsubMatcher.test(key) === true) {
					var handle = hub.subscribe(key, lang.hitch(this, function() {
						method.apply(this, arguments);
					}));
					this._bindings.push({
						type: 'pubsub',
						handle: handle 
					});

					return true; //continue
				}

				//regular browser events
				var match = key.match(eventSplitter);
				if (match === null) {
					return true; //continue
				}
				var selector = match[1];
				var eventName = match[2];

				//console.log(key, "'" + selector + "'", "'" + eventName + "'");
				
				//make an event handler that will execute in this object's
				//context ("this" points to this Controller object).
				var handler = lang.hitch(this, function(ev) {
					//pass along any other arguments (special event plugins)
					var args = [].slice.call(arguments, 1);
					//the event and target go up front
					args.unshift(ev, ev.currentTarget);
					return method.apply(this, args);
				});

				//allow binding to objects
				if ((match = selector.match(objectSplitter)) !== null) {
					var obj;

					//special case: binding to this controller's root element
					if (match[1] === "root") {
						obj = this._root[0];
					}
					//bind to a property of this controller
					else if (lang.getObject(match[1], false, this)) {
						obj = lang.getObject(match[1], false, this);
					}
					//bind to a global element (window, document)
					else if (lang.getObject(match[1])) {
						obj = lang.getObject(match[1]);
					}
					//bind to a selector string, but make it the delegate target
					//instead of this.root()
					else {
						obj = match[1];
					}

					if (!obj) {
						return true; //continue
					}

					//is there any more to the selector string? 
					//{_element} .child click, for instance, should delegate
					//clicks on ".child" to {_element}
					if (match[2]) {
						$(obj).on(eventName, match[2], eventData[key], handler);

						this._bindings.push({
							type: 'delegate',
							root: obj,
							selector: match[2],
							eventName: eventName,
							handler: handler
						});
					}
					else {
						$(obj).on(eventName, eventData[key], handler);

						this._bindings.push({
							type: 'bind',
							selector: obj,
							eventName: eventName,
							handler: handler
						});
					}

					return true; //continue
				}

				//for everything else, use event delegation for performance
				//and versatility
				this._root.on(eventName, selector, eventData[key], handler);

				this._bindings.push({
					type: 'delegate',
					root: this._root,
					selector: selector,
					eventName: eventName,
					handler: handler
				});
			
			}));
		
		},


		unbind: function() {
			$.each(this._bindings, function() {
				var binding = this;
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

			this._bindings = [];
		},


		rebind: function() {
			this.unbind();
			this.bind();
		},


		//like dojo's -chains-, but with (potential) deferred objects
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
					return Deferreds.series.apply(this, list);
				});
			}));
		}
	
	});


});
