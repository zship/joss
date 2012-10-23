/*
 * jQuery.event.input
 *
 * MIT license
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
			$(el).data('event.special.input-hash-gen', '');
			return el[ex];
		}
	};



	/*
	 * `contexts`, conceptually, is a 
	 * Map<(parent HTMLElement), List<Map<(child selector), (handler object)>>>
	 * It looks like this:
	 * {
	 *   '<HTMLElement "hash">': [
	 *     {
	 *       '<selector string>': <handler object>,
	 *     },
	 *     {
	 *       '<selector string 2>': <handler object 2>
	 *     }
	 *   ],
	 *   '<HTMLElement "hash" 2>': [
	 *   ...
	 * }
	 */
	var contexts = {};

	$.event.special.input = {

		setup: function() {
			contexts[Util.hash(this)] = {};
			$(this).bind('input propertychange paste cut keydown drop', mainHandler);

			//we're hijacking the input event except in the body of this
			//plugin. returning false will cause the above bind() to bind to the
			//native 'input' event rather than $.event.special.input
			return false; 
		},


		teardown: function() {
			var context = contexts[Util.hash(this)];
			if (context.length > 0) {
				return;
			}
			console.log('unbound');
			$(this).unbind('input propertychange paste cut keydown drop', mainHandler);
			delete contexts[Util.hash(this)];
		},


		add: function(obj) {
			obj.selector = obj.selector || 'ROOT';
			contexts[Util.hash(this)][obj.selector] = obj;

			var oldHandler = obj.handler;
			obj.handler = function(ev) {
				//Block events other than what we provide.
				//Evil? Eh, it's either this or don't use the name 'input' for
				//the event (because you can't reliably determine oninput
				//support in browsers without actually trying it out)
				if (!ev.synthesized) {
					return;
				}
				oldHandler.apply(ev.currentTarget, arguments);
			};
		},


		remove: function(obj) {
			obj.selector = obj.selector || 'ROOT';
			delete contexts[Util.hash(this)][obj.selector];
		}

	};


	var hasNativeOnInput = false;

	var mainHandler = function(ev) {

		var context = contexts[Util.hash(this)];
		var length = 0;
		for (var name in context) length++;
		var target;

		//regular bind
		if (length === 1 && context['ROOT']) {
			target = context['ROOT'];
		}
		//delegation
		else {
			//determine if the event target is bound through this plugin
			$.each(context, function(key, obj) {
				if (key === 'ROOT') {
					return true; //continue
				}
				if ($(ev.target).is(key)) {
					target = obj;
					return false; //break
				}
			});
		}

		//ev.target is not bound through us (probably bubbled up to $(this) but
		//not bound to anything in particular)
		if (!target) {
			return false;
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
			//input event works. unbind everything else.
			case 'input':
				if (!hasNativeOnInput) {
					//fast-track successive calls. this plugin's just a dumb
					//forwarder in that case.
					hasNativeOnInput = true;
					$(this).unbind('propertychange paste cut keydown drop', mainHandler);
				}
				target.handler(newEvent);
				break;
			//emulation by comparing values for everyone else.
			case 'propertychange':
				if (ev.originalEvent.propertyName === "value") {
					firstChangedTrigger(newEvent, target);
				}
				break;
			//these four fire before the value is updated, so delay them.
			case 'paste':
			case 'cut':
			case 'keydown':
			case 'drop':
				window.setTimeout(function() {
					firstChangedTrigger(newEvent, target);
				}, 1000/60);
				break;
		}

		//console.log($(this).data('events'));

	};


	//events hit this method as fast as they can; first one to hit with a
	//changed value wins.
	var firstChangedTrigger = function(event, target) {
		var el = event.currentTarget;
		if (el.value !== $(el).data('event.special.input.value')) {
			$(el).data('event.special.input.value', el.value);
			target.handler(event);
		}
	};


	//shorthand method (do people use these?)
	$.fn.input = function(handler) {
		return handler ? this.bind("input", handler) : this.trigger("input");
	};

})(window.jQuery);
