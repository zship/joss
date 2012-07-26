(function(window, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['jquery', 'joss/dojo'], factory);
	} else {
		// Browser globals
		dojo.setObject('joss.mvc.Service', factory(jQuery, dojo));
	}
})(this, function($, dojo) {

	return dojo.declare(null, {

		constructor: function() {
		},

		/*
		 * @type {string}
		 * A namespace under which to publish 
		 * created, updated, and destroyed events
		 */
		namespace: null,

		/*
		 * @type {string}
		 * REST-style url to make get, put, post, and delete 
		 * requests against
		 */
		url: null,

		idField: null,

		get: function(opts) {
			if (typeof opts === 'number') {
				var id = opts;
				opts = {
					id: id
				};
			}

			opts = dojo.mixin({
				id: null
			}, opts);


			return dojo.xhrGet({
				url: this.url,
				content: {
					id: opts.id
				},
				headers: {
					'Accept': 'application/json',
					'SessionID': 'testing'
				},
				handleAs: 'json'
			});
		},

		list: function(opts) {
			opts = dojo.mixin({
				view: null
			}, opts);

			return dojo.xhrPost({
				url: this.url,
				content: {
					_method: 'GET',
					view: dojo.toJson(opts.view)
				},
				headers: {
					'Accept': 'application/json',
					'Range': '0-20'
				},
				handleAs: 'json'
			});
		},

		save: function(obj) {

			var self = this;
			var isNew = false;

			if (!obj[idField]) {
				isNew = true;
			}

			if (isNew) {
				return dojo.xhrPost({
					url: self.url,
					content: obj,
					headers: {
						'Accept': 'application/json'
					},
					handleAs: 'json',
					load: function(response) {
						dojo.publish(self.namespace + ':created');
					}
				});
			}

			return dojo.xhrPut({
				url: this.url,
				content: obj,
				headers: {
					'Accept': 'application/json'
				},
				handleAs: 'json',
				load: function(response) {
					dojo.publish(self.namespace + ':updated');
				}
			});
		
		},

		remove: function(id) {
			return dojo.xhrDelete({
				url: this.url,
				content: {
					id: id
				},
				headers: {
					'Accept': 'application/json'
				},
				handleAs: 'json',
				load: function(response) {
					dojo.publish(self.namespace + ':destroyed');
				}
			});
		}
	
	});

});
