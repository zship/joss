define(function(require) {

	var $ = require('jquery');
	var declare = require('dojo/_base/declare');
	var jade = require('jade');



	return declare(null, {

		constructor: function() {
		},

		cache: null,

		//Subclasses must override and return a jQuery element
		render: function() {},

		load: function(file) {

			if (!file) {
				console.error('No file was specified in call to JadeView.load');
			}

			if (this.cache) {
				return this.cache;
			}

			var self = this;

			$.ajax({
				url: file,
				async: false,
				dataType: 'text'
			}).then(function(response) {
				//var start = new Date();
				self.cache = jade.compile(response);
				//var end = new Date();
				//console.log('compilation time: ' + (end-start) + 'ms');
			});

			//console.log(this.cache.toString());

			return this.cache;

		}
	
	});

});
