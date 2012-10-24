define(function(require) {

	var $ = require('jquery');
	var declare = require('dojo/_base/declare');
	var lang = require('dojo/_base/lang');
	var hub = require('dojo/topic');



	return declare(null, {

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

			opts = lang.mixin({
				id: null
			}, opts);


			return $.ajax({
				url: this.url,
				method: 'GET',
				data: {
					id: opts.id
				},
				dataType: 'json'
			});
		},

		list: function(opts) {
			opts = lang.mixin({
				view: null
			}, opts);

			return $.ajax({
				url: this.url,
				method: 'POST',
				data: {
					_method: 'GET',
					view: lang.toJson(opts.view)
				},
				headers: {
					'Range': '0-20'
				},
				dataType: 'json'
			});
		},

		save: function(obj) {

			var self = this;
			var isNew = false;

			if (!obj[this.idField]) {
				isNew = true;
			}

			if (isNew) {
				return $.ajax({
					url: self.url,
					method: 'POST',
					data: lang.toJson(obj),
					dataType: 'json'
				}).then(function() {
					hub.publish(self.namespace + ':created');
				});
			}

			return $.ajax({
				url: this.url,
				method: 'PUT',
				data: lang.toJson(obj),
				dataType: 'json'
			}).then(function() {
				hub.publish(self.namespace + ':updated');
			});
		
		},

		remove: function(id) {
			var self = this;
			return $.ajax({
				url: this.url,
				method: 'DELETE',
				data: {
					id: id
				},
				dataType: 'json'
			}).then(function() {
				hub.publish(self.namespace + ':destroyed');
			});
		}
	
	});

});
