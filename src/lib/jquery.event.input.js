/*
 * jQuery.event.input
 *
 * (C) 2012 Zach Shipley | MIT license
 * www.opensource.org/licenses/mit-license.php
 */
(function($) {

	var Util = {
		//poor man's HTMLElement hash code
		hash: function(el) {
			var ex = $.expando;
			if (el[ex]) {
				return el[ex];
			}
			$(el).data('event.special.input.hash', '');
			return el[ex];
		}
	};


	//the data structure keeping track of delegate parents and their children
	//and their children's handlers was getting too unclear, so I introduced an
	//object-oriented one below.


	//Map<(Bound) DOMElement, HandlerMap>
	var BoundElementMap = function() {
		this.map = {};
	};

	BoundElementMap.prototype.put = function(element, handlerMap) {
		var hash = Util.hash(element);
		this.map[hash] = handlerMap;
		return this;
	};

	//return HandlerMap
	BoundElementMap.prototype.get = function(element) {
		var hash = Util.hash(element);
		return this.map[hash] || new HandlerMap();
	};

	BoundElementMap.prototype.remove = function(element) {
		var hash = Util.hash(element);
		delete this.map[hash];
		return this;
	};


	//Multimap<(Selector) String, (Event Handler) Function>
	//explanation of Multimaps: http://docs.guava-libraries.googlecode.com/git-history/release/javadoc/index.html
	//I'm only implementing the methods used in this plugin, of course
	var HandlerMap = function() {
		this.handlers = {};
	};

	HandlerMap.prototype.put = function(selector, handler) {
		//ROOT means no selector: a non-delegated binding on this.element
		selector = selector || 'ROOT';
		this.handlers[selector] = this.handlers[selector] || [];
		this.handlers[selector].push(handler);
		return this;
	};

	//return Array<Handle Object>
	HandlerMap.prototype.get = function(selector) {
		return this.handlers[selector] || [];
	};

	//return Array<(Selector) String>
	HandlerMap.prototype.keys = function() {
		var ret = [];
		for (var key in this.handlers) {
			ret.push(key);
		}
		return ret;
	};

	HandlerMap.prototype.remove = function(selector, handler) {
		var handlerList = this.handlers[selector] || [];

		for (var i = 0, len = handlerList.length; i < len; i++) {
			var childHandler = handlerList[i];
			if (childHandler === handler) {
				this.handlers[selector].splice(i, 1);
				break;
			}
		}

		if (!this.handlers[selector].length) {
			delete this.handlers[selector];
		}

		return this;
	};




	//switches to "true" the first time an actual 'input' event registers
	var hasNativeOnInput = false;
	//Map<(Bound) DOMElement, Multimap<(Selector) String, (Event Handler) Function>>
	var boundElements = new BoundElementMap();

	$.event.special.input = {

		setup: function() {
			boundElements.put(this, new HandlerMap());

			if (hasNativeOnInput) {
				$(this).bind('input', {'event.special.input': true}, mainHandler);
			}
			else {
				$(this).bind('input propertychange paste cut keydown drop', {'event.special.input': true}, mainHandler);
			}

			//we're hijacking the input event except in the body of this
			//plugin. returning false will cause the above bind() to bind to the
			//native 'input' event rather than $.event.special.input
			return false;
		},


		teardown: function() {
			$(this).unbind('input propertychange paste cut keydown drop', mainHandler);
			boundElements.remove(this);
		},


		add: function(handle) {
			if (handle.data && handle.data['event.special.input']) {
				return;
			}

			var oldHandler = handle.handler;
			handle.handler = function(ev) {
				//Block oninput events other than what we provide.
				//Evil? Eh, it's either this or don't use the name 'input' for
				//the event (because you can't reliably determine oninput
				//support in browsers without actually trying it out)
				if (!ev.synthesized) {
					return;
				}
				return oldHandler.apply(ev.currentTarget, arguments);
			};

			boundElements.get(this).put(handle.selector, handle.handler);
		},


		remove: function(handle) {
			boundElements.get(this).remove(handle.selector, handle.handler);
		}

	};




	var mainHandler = function(ev) {

		var handlers = [];
		var handlerMap = boundElements.get(this);
		var selectors = handlerMap.keys();

		for (var i = 0, len = selectors.length; i < len; i++) {
			//regular bind
			if (selectors[i] === 'ROOT') {
				handlers = handlers.concat(handlerMap.get(selectors[i]));
			}
			//delegation
			else {
				if ($(ev.target).is(selectors[i])) {
					handlers = handlers.concat(handlerMap.get(selectors[i]));
				}
			}
		}

		//ev.target is not bound through us
		if (!handlers.length) {
			return true;
		}

		var newEvent = $.extend(
			new $.Event('input'),
			{
				//move target around to simulate normal delegation output
				currentTarget: ev.target,
				delegateTarget: ev.currentTarget,
				target: ev.currentTarget,
				synthesized: true
			}
		);

		switch (ev.type) {
			case 'input':
				//native input event works. unbind everything else and skip
				//checking for changed values.
				if (!hasNativeOnInput) {
					hasNativeOnInput = true;
					$(this).unbind('propertychange paste cut keydown drop', mainHandler);
				}
				triggerList(handlers, newEvent);
				break;
			//emulation by comparing values for everyone else.
			case 'propertychange':
				if (ev.originalEvent.propertyName === "value") {
					triggerFirstChanged(handlers, newEvent);
				}
				break;
			//these four fire before the value is updated, so delay them.
			case 'paste':
			case 'cut':
			case 'keydown':
			case 'drop':
				window.setTimeout(function() {
					triggerFirstChanged(handlers, newEvent);
				}, 0); //minimum setTimeout is typically ~16ms
				break;
		}

	};


	//trigger an event on a list of handlers
	var triggerList = function(handlers, event) {
		for (var i = 0, len = handlers.length; i < len; i++) {
			handlers[i](event);
		}
	};


	//events hit this method as fast as they can; first one to hit with a
	//changed value wins (handler is triggered).
	var triggerFirstChanged = function(handlers, event) {
		var el = event.currentTarget;
		if (el.value !== $(el).data('event.special.input.value')) {
			$(el).data('event.special.input.value', el.value);
			triggerList(handlers, event);
		}
	};


	$.fn.input = function(handler) {
		return handler ? this.bind("input", handler) : this.trigger("input");
	};

})(window.jQuery);
