(function(window, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['jquery', 'joss/dojo'], factory);
	} else {
		// Browser globals
		dojo.setObject('joss.mvc.HtmlView', factory(jQuery, dojo));
	}
})(this, function($, dojo) {

	var cache = [];

	return dojo.declare(null, {

		constructor: function() {
		},

		//Subclasses must override and return a jQuery element
		render: function() {},

		load: function(file) {

			if (!file) {
				console.error('No file was specified in call to HtmlView.load');
			}

			if (cache[file]) {
				return cache[file].clone();
			}

			var self = this;

			$.ajax({
				url: file,
				async: false,
				dataType: 'text'
			}).then(function(response) {
				/*
				 * remove all leading/trailing whitespace and line breaks so
				 * spaces are guaranteed to be intentional.
				 *
				 * modified from: http://blog.stevenlevithan.com/archives/faster-trim-javascript
				 * to use multi-line regexes and remove line breaks
				 *
				 * don't worry! performance across 20 iterations of the Magna Carta:
				 * FF8 4ms
				 * Chome 6ms
				 * IE7, IE8 10ms
				 */
				response = response.replace(/^\s\s*/gm, '').replace(/\s\s*$/gm, '').replace(/>\n</gm, '><');
				cache[file] = $(response);
			});

			return cache[file].clone();

		}
	
	});

});
