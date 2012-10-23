/*
 * Static utility methods dealing with forms and form inputs
 */
define(function(require) {

	var $ = require('jquery');


	var Forms = {
	
		//modified from the jQuery form library (http://jquery.malsup.com/form/)
		//grab the value of any form input, as it would be submitted to the server
		//_getVal differs from $.fn.val() in that it works with <select> and radio buttons
		/**
		 * @param {Object|jQuery|Element} el
		 * @param {String} val
		 */
		val: function(el, val) {

			if (val !== undefined) {
				if (el.constructor === $) {
					return Forms._setVal(el[0], val);
				}
				return Forms._setVal(el, val);
			}

			if (el.constructor === Object) {
				var realEl = el['el'];
				if (realEl.constructor === $) {
					realEl = realEl[0];
				}
				var successful = (el['successful'] === undefined) ? false : el['successful'];
				return Forms._getVal(realEl, successful);
			}

			if (el.constructor === $) {
				return Forms._getVal(el[0], false);
			}

			return Forms._getVal(el, false);
		
		},

		_getVal: function(el, mustBeSuccessful) {

			var n = el.name, t = el.type, tag = el.tagName.toLowerCase();

			if (mustBeSuccessful && !Forms.successful(el)) {
				return null;
			}

			if (tag === 'select') {
				var index = el.selectedIndex;
				if (index < 0) {
					return null;
				}
				var a = [], ops = el.options;
				var one = (t === 'select-one');
				var max = (one ? index+1 : ops.length);
				for(var i=(one ? index : 0); i < max; i++) {
					var op = ops[i];
					if (op.selected) {
						var v = op.value;
						if (!v) { // extra pain for IE...
							v = (op.attributes && op.attributes['value'] && !(op.attributes['value'].specified)) ? op.text : op.value;
						}
						if (one) {
							return v;
						}
						a.push(v);
					}
				}
				return a;
			}

			if (t === 'radio') {
				return $(el.form[n]).filter(':checked').val();
			}

			if (t === 'checkbox') {
				return el.checked;
			}

			return $(el).val();
		
		},

		_setVal: function(el, val) {

			var t = el.type;
			var tag = el.tagName.toLowerCase();

			if (tag === 'select') {

				if (t === 'select-one') {

					var selectedOpt = $(el).find('option[value="' + val + '"]');

					if (!selectedOpt) {
						return false;
					}

					el.options.selectedIndex = selectedOpt.index();
					return true;
				
				}

				//multiple select
				if (val.constructor !== 'Array') {
					val = [val];
				}

				for (var i = 0, l = el.options.length, opt; i < l; i++)
				{
					opt = el.options[i];
					if (val.indexOf( opt.value ) !== -1) {
						opt.selected = true;
					}
					else {
						opt.selected = false;
					}
				}

				return true;
			
			}

			$(el).val(val);
			return true;
		
		},


		/**
		 * Returns whether a form element is 'successful', that is, whether it
		 * would be submitted to the server in a normal form submit.
		 * More info: http://www.w3.org/TR/html4/interact/forms.html#successful-controls
		 *
		 * @param {jQuery|Element} el
		 */
		successful: function(el) {

			if (el.constructor === $) {
				el = el[0];
			}

			var n = el.name, t = el.type, tag = el.tagName.toLowerCase();

			if (!n || el.disabled) {
				return false;
			}

			if (t === 'reset' || t === 'button') {
				return false;
			}

			if ((t === 'checkbox' || t === 'radio') && !el.checked) {
				return false;
			} 

			if ((t === 'submit' || t === 'image') && el.form && el.form.clk !== el) {
				return false;
			} 

			if (tag === 'select' && el.selectedIndex === -1) {
				return false;
			}

			return true;
		
		}

	};

	return Forms;

});
