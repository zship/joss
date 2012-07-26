(function(window, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['jquery', 'joss/dojo', 'jade/jade'], factory);
	} else {
		// Browser globals
		dojo.setObject('joss.mvc.JadeView', factory(jQuery, dojo, jade));
	}
})(this, function($, dojo, jade) {

	return dojo.declare(null, {

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
				var start = new Date();
				self.cache = jade.compile(response);
				var end = new Date();
				console.log('compilation time: ' + (end-start) + 'ms');
			});

			//console.log(this.cache.toString());

			return this.cache;

		}
	
	});

});
