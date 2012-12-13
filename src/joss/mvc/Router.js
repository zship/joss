define(function(require) {

	var $ = require('jquery');
	var Classes = require('joss/oop/Classes');
	var forOwn = require('amd-utils/object/forOwn');
	require('jquery.hashchange');


	var routeMatcher = /^\/.*/;
	var param = /\{([\w\d]+)\}/g;

	var Router = Classes.create(/** @lends joss/mvc/Router.prototype */ {

		constructor: function() {
			
			this.bindRoutes();
			//console.log('bindings', this._routes);
			
			$(window).bind('hashchange', function() {
				var fragment = window.location.hash.replace(/^#/, '');
				this.route(fragment);
			}.bind(this));

			/*
			 * On a full page load, check if there's a
			 * hash and trigger it
			 */
			$(document).ready(function() {
				var fragment = window.location.hash.replace(/^#/, '');
				this.route(fragment);
			}.bind(this));

		},


		_routes: null,


		bindRoutes: function() {

			this._routes = [];

			var self = this;

			forOwn(this, function(key, method) {
				if (key === '*') {
					return; //continue;
				}

				if (routeMatcher.test(key) !== true) {
					return; //continue;
				}

				var route = self._routeToRegExp(key);
				self._routes.push({
					route: route,
					callback: function(fragment) {
						var args = self._extractParameters(route, fragment);
						method.apply(self, args);
					}
				});
			
			});

		},


		route: function(fragment) {

			//special case: no hash triggers the '/' mapping, if there is one
			if (!fragment && this['/']) {
				this['/']();
				return;
			}

			if (this['*']) {
				this['*'](fragment);
				return;
			}

			this._routes.forEach(function(binding) {
				//console.log('testing', binding.route.toString(), fragment);
				if (binding.route.test(fragment)) {
					//because of the history api being used, errors may
					//result in a full page load, which could be an invalid
					//URL. We catch errors here to ensure that doesn't happen
					try {
						binding.callback(fragment);
					}
					catch(e) {
						console.error(e);
					}
				}
			});

		},


		_routeToRegExp : function(route) {
			route = route.replace(param, "([^\/]*)");
			return new RegExp('^' + route + '$');
		},

		_extractParameters : function(route, fragment) {
			return route.exec(fragment).slice(1);
		}
	
	});

	return Router;

});
