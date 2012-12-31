define(function(require) {

	var $ = require('jquery');
	var Classes = require('joss/oop/Classes');
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

			var proto = Object.getPrototypeOf(this);

			var methods = Object.keys(this)
				.concat(Object.keys(proto))
				.filter(function(key) {
					if (key === '*' || key === '*?') {
						return false;
					}

					return routeMatcher.test(key);
				}.bind(this));

			methods.forEach(function(key) {
				var method = this[key];
				var route = this._routeToRegExp(key);
				this._routes.push({
					pattern: route,
					callback: function(fragment) {
						var args = this._extractParameters(route, fragment);
						args.push(fragment); //last arg is always full fragment
						method.apply(this, args);
					}.bind(this)
				});
			}.bind(this));

		},


		route: function(fragment) {

			//special case: no hash triggers the '/' mapping, if there is one
			if (!fragment) {
				if (this['/']) {
					this['/']();
				}
				return;
			}

			var matching = this._routes.filter(function(route) {
				return (route.pattern.test(fragment));
			});
			
			matching.forEach(function(route) {
				//because of the history api being used, errors may
				//result in a full page load, which could be an invalid
				//URL. We catch errors here to ensure that doesn't happen
				try {
					route.callback(fragment);
				}
				catch(e) {
					console.error(e);
				}
			});

			//match any hashchange event
			if (this['*']) {
				this['*'](fragment);
			}

			//match any hashchange event not explicitly defined
			if (this['*?'] && matching.length === 0) {
				this['*?'](fragment);
			}

		},


		_routeToRegExp : function(route) {
			route = route.replace(param, "([^\/]*)");
			return new RegExp('^' + route + '(?:\/)?$');
		},

		_extractParameters : function(route, fragment) {
			return route.exec(fragment).slice(1);
		}
	
	});


	return Router;

});
