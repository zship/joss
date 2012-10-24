/*
 ---------------------------------------------------
 FormToggle

 enabling, disabling, and restoring whole groups of
 inputs
 ---------------------------------------------------
 */
define(function(require) {

	var $ = require('jquery');
	var Forms = require('joss/util/Forms');
	var Elements = require('joss/util/Elements');



	var selfOrChildren = function(context) {
		if (context.is('input, select, textarea')) {
			return context;
		}
		else if (context.is('span.placeholder')) {
			//if a placeholder was passed to enable, disable, etc.,
			//operate on the input element to which the placeholder applies
			return context.data('for');
		}
		else {
			return context.find('input, select, textarea').not('[type="button"]');
		}
	};

	var template = $('<span class="placeholder"></span>');



	/*
	 Hide form inputs and replace with text placeholders.
	 Inputs remain valid for submission (http://www.w3.org/TR/html401/interact/forms.html#h-17.13.2)
	 
	 To invalidate inputs for submission, pass
	 true as the "invalidate" option
	 */
	$.fn.disable = function(invalidate) {

		var elems = selfOrChildren(this);
		var queue = [];

		elems.each(function() {
			var el = $(this);
			var val = el.val();
			var t = this.type, tag = this.tagName.toLowerCase();

			//don't disable twice
			if (el.next('.placeholder').length !== 0) {
				return; //continue
			}

			//don't put placeholders in for hidden elements
			if (t === 'hidden') {
				return;
			}

			if (t === 'checkbox' || t === 'radio') {
				if (val === 'on') {
					val = 'yes';
				}
				else {
					val = 'no';
				}
			}

			else if (t === 'password') {
				val = "********";
			}

			else if (tag === 'select') {
				val = el.find('option:selected').text();
			}

			var placeholder = template.clone();
			placeholder.text(val);
			placeholder.data("for", el);

			var styleNames = [
				'float',
				'borderTopWidth',
				'borderBottomWidth',
				'borderLeftWidth',
				'borderRightWidth',
				'marginTop',
				'marginBottom',
				'marginLeft',
				'marginRight',
				'paddingTop',
				'paddingBottom',
				'paddingLeft',
				'paddingRight'
			];

			var styles = Elements.getStyles(this, styleNames);
			styles['width'] = this.offsetWidth;
			styles['width'] -= parseInt(styles['borderLeftWidth'], 10) || 0;
			styles['width'] -= parseInt(styles['borderRightWidth'], 10) || 0;
			styles['width'] -= parseInt(styles['paddingLeft'], 10) || 0;
			styles['width'] -= parseInt(styles['paddingRight'], 10) || 0;
			styles['height'] = this.offsetHeight;
			styles['height'] -= parseInt(styles['borderTopWidth'], 10) || 0;
			styles['height'] -= parseInt(styles['borderBottomWidth'], 10) || 0;
			styles['height'] -= parseInt(styles['paddingTop'], 10) || 0;
			styles['height'] -= parseInt(styles['paddingBottom'], 10) || 0;

			Elements.setStyles(placeholder[0], styles);

			queue.push({
				el: el,
				placeholder: placeholder
			});

		});

		//perform all redraws here to avoid repaints in the loop above
		//more here: http://calendar.perfplanet.com/2009/rendering-repaint-reflow-relayout-restyle/
		this.hide(); //take the container out of the flow before appending placeholders (*the biggest* speedup here)
		$.each(queue, function(i, item) {
			item.placeholder.insertAfter(item.el);
			item.el.hide();
		});
		this.show(); //put it back in the flow to trigger the repaint

		//even if disabling twice, force through "true" disable requests
		elems.each(function() {
			if (typeof invalidate !== 'undefined' && invalidate) {
				this.disabled = true;
			}
		});

		return this;
	};


	$.fn.enable = function() {
		selfOrChildren(this).each(function() {
			this.disabled = false;

			$(this).next('.placeholder').remove();
			$(this).next().next('.placeholder').remove();
			$(this).show();

			$(this).data("previousValue", Forms.val(this));
		});
	};


	$.fn.restore = function() {

		selfOrChildren(this).each(function() {
			var value = $(this).data("previousValue");
			var t = this.type, tag = this.tagName.toLowerCase();

			if (value !== undefined) {
				if (t === 'hidden' || t === 'text' || t === 'password' || tag === 'textarea') {
					this.value = value;
				}
				else if (t === 'checkbox' || t === 'radio') {
					if (value === 'on') {
						this.checked = true;
					}
					else {
						this.checked = false;
					}
				}
				else if (tag === 'select') {
					Forms.val(this, value);
				}
			}
		});

		return this;
	
	};

});
