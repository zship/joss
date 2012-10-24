define(function(require) {

	var $ = require('jquery');
	var declare = require('dojo/_base/declare');



	return declare(null, {

		constructor: function() {
		},

		cache: null,

		//Subclasses must override and return a jQuery element
		render: function() {},

		/*
		 * Perform an ajax request for the template file for this view,
		 * ensuring that it is only loaded once for all instances.
		 */
		load: function(file) {

			if (!file) {
				console.error('No file was specified in call to View.load');
			}

			if (this.cache) {
				return this.cache;
			}

			var data;
			var self = this;

			$.ajax({
				url: file,
				async: false,
				dataType: 'text'
			}).then(function(response) {
				data = self.cache = response;
			});

			return data;

		}

	});

});
