define(function(require) {

	var $ = require('jquery');
	var declare = require('dojo/_base/declare');



	var cache = [];

	return declare(null, {

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
