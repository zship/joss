(function(window, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['jquery', 'joss/dojo', 'jquery.hashchange'], factory);
	} else {
		// Browser globals
		dojo.setObject('joss.mvc.Router', factory(jQuery, dojo));
	}
})(this, function($, dojo) {

	var routeMatcher = /^\/.*/;
	var param = /\{([\w\d]+)}/g;

	return dojo.declare(null, {

		constructor: function(opts) {
			
			this.bind();
			//console.log('bindings', this._bindings);

		},

		_bindings: null,

		bind: function() {

			this._bindings = [];

			var self = this;

			$.each(this, function(key, method) {

				if (routeMatcher.test(key) !== true) {
					return; //continue;
				}

				var route = self._routeToRegExp(key);
				self._bindings.push({
					route: route,
					callback: function(fragment) {
						var args = self._extractParameters(route, fragment);
						method.apply(self, args);
					}
				});
			
			});

			$(window).bind('hashchange', function() {
				var fragment = window.location.hash.replace(/^#/, '');

				//special case: no hash triggers the '/' mapping, if there is one
				if (!fragment && self['/']) {
					self['/']();
					return;
				}

				$.each(self._bindings, function(i, binding) {
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
			});

            /*
			 *History.Adapter.bind(window, 'statechange', function() {
			 *    var fragment = History.getState().hash;
			 *    //console.log(History.getState());
			 *    $.each(self._bindings, function(i, binding) {
			 *        //console.log('testing', binding.route.toString(), fragment);
			 *        if (binding.route.test(fragment)) {
			 *            //because of the history api being used, errors may
			 *            //result in a full page load, which could be an invalid
			 *            //URL. We catch errors here to ensure that doesn't happen
			 *            try {
			 *                binding.callback(fragment);
			 *            }
			 *            catch(e) {
			 *                console.error(e);
			 *            }
			 *        }
			 *    });
			 *});
             */

			/*
			 * On a full page load, check if there's a
			 * hash and trigger it
			 */
			$(document).ready(function() {
				$(window).trigger('hashchange');
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

});
