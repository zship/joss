/*
 * Implements a fixed-timestep game loop
 * http://gafferongames.com/game-physics/fix-your-timestep/
 */
define(function(require) {

	var $ = require('jquery');
	var declare = require('dojo/_base/declare');
	var lang = require('dojo/_base/lang');



	// requestAnimationFrame polyfill by Erik Möller
	// fixes from Paul Irish and Tino Zijdel
	(function () {

		var lastTime = 0;
		var vendors = [ 'ms', 'moz', 'webkit', 'o' ];

		for ( var x = 0; x < vendors.length && !window.requestAnimationFrame; ++ x ) {
			window.requestAnimationFrame = window[ vendors[ x ] + 'RequestAnimationFrame' ];
			window.cancelAnimationFrame = window[ vendors[ x ] + 'CancelAnimationFrame' ] || window[ vendors[ x ] + 'CancelRequestAnimationFrame' ];
		}

		if ( !window.requestAnimationFrame ) {
			window.requestAnimationFrame = function (callback) {
				var currTime = Date.now(), timeToCall = Math.max( 0, 16 - ( currTime - lastTime ) );
				var id = window.setTimeout( function() { callback( currTime + timeToCall ); }, timeToCall );
				lastTime = currTime + timeToCall;
				return id;
			};
		}

		if ( !window.cancelAnimationFrame ) {
			window.cancelAnimationFrame = function ( id ) { window.clearTimeout( id ); };
		}

	}());


	//performance.now polyfill (simplify code below)
	window.performance = window.performance || {};
	window.performance.now =
		window.performance.now ||
		window.performance.mozNow ||
		window.performance.msNow ||
		window.performance.oNow ||
		window.performance.webkitNow ||
		function() { return new Date().getTime(); };


	return declare(null, {

		constructor: function(opts) {

			opts = $.extend(true, {
				logic: null, //function(prevState, t, dt)
				interpolate: null, //function(prevState, currState, alpha)
				draw: null, //function(state)
				dt: 1000/60
			}, opts);

			this._interpolateCallbackDefined = !!opts.interpolate || this['gameloop.interpolate'];

			//if subclassing, allow callbacks to be defined as members of the subclass
			this._logicCallback = opts.logic || this['gameloop.logic'];
			this._interpolateCallback = opts.interpolate || this['gameloop.interpolate'];
			this._drawCallback = opts.draw || this['gameloop.draw'];
			this._dt = opts.dt;

			this._killed = false;
			this._running = false;

		},


		start: function() {

			this._killed = false;
			this._running = true;

			var t = 0;
			var currentTime = window.performance.now();
			var accumulator = 0;
			var previousState = null;
			var currentState = null;

			var loop = lang.hitch(this, function() {

				if (this._killed) {
					this._running = false;
					return;
				}

				var now = window.performance.now();
				var frameTime = now - currentTime;
				currentTime = now;
				var changed = false;

				//max frame time to avoid spiral of death
				if (frameTime > this._dt * 25) {
					frameTime = this._dt * 25;
				}

				accumulator += frameTime;

				while (accumulator >= this._dt) {
					previousState = currentState;
					currentState = this._logicCallback(previousState, t, this._dt);
					t += this._dt;
					accumulator -= this._dt;
					changed = true;
				}

				//reminder: mutating state in below callbacks will carry over
				//into this._logicCallback's previousState arg
				if (this._interpolateCallbackDefined && currentState && previousState) {
					var state = this._interpolateCallback(previousState, currentState, accumulator/this._dt);
					this._drawCallback(state);
				}
				//if interpolation is not being used, don't render partial time steps
				else if (changed) {
					this._drawCallback(currentState);
				}

				window.requestAnimationFrame(loop);

			});

			loop(currentTime);

		},


		stop: function() {
			//set kill flag, wait for the current tick to finish
			var deferred = $.Deferred();
			this._killed = true;
			var interval = window.setInterval(lang.hitch(this, function() {
				if (!this._running) {
					window.clearInterval(interval);
					deferred.resolve();
				}
			}), 0);
			return deferred;
		}


	});

});
