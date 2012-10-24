define(function(require) {

	var $ = require('jquery');
	var declare = require('dojo/_base/declare');
	var lang = require('dojo/_base/lang');
	var Controller = require('joss/mvc/Controller');
	var Point = require('joss/geometry/Point');
	require('joss/geometry/DomRect');
	require('jquery.mousewheel');
	require('jquery.event.drag');
	require('jquery.jgestures');



	return declare(Controller, {

		constructor: function() {

			this.root().addClass('scrollable');

		},


		render: function() {

			if (this._track) {
				this._track.remove();
			}

			this._bar = $('<div class="scrollable-bar"></div>').appendTo('body');
			this._track = $('<div class="scrollable-track"></div>').appendTo(this._bar);
			this._thumb = $('<div class="scrollable-thumb"></div>').appendTo(this._track);
			this.root().wrapInner('<div class="scrollable-inner"></div>');
			this._inner = this.root().find('.scrollable-inner');
			this.resize();
			this.rebind();

		},


		destroy: function() {

			this._bar.remove();
			this.root().removeClass('scrollable');
		
		},


		_active: false,


		show: function() {

			this._active = true;
			this._bar.show();
			this._bar.css({opacity: 1});
		
		},


		hide: function() {

			if (this._dragging) {
				return;
			}

			this._active = false;
			this._bar.css({opacity: 0});
			window.setTimeout(lang.hitch(this, function() {
				this._bar.hide();
			}), 200);
		
		},


		resize: function() {
		
			//cache relevant dimensions so we're not calculating them during events
			this._rootRect = this.root().rect();
			this._innerRect = this._inner.rect();
			this._innerRect.moveTop(0);
			this._barRect = this._bar.rect()
				.height(this._rootRect.height())
				.position({
					my: 'top left',
					at: 'top right',
					of: this._rootRect
				})
				.apply();

			this._trackRect = this._track.rect();

			var ratio = this._rootRect.height() / this.root()[0].scrollHeight;
			this._thumbRect = this._thumb.rect()
				.height( this._trackRect.height() * ratio )
				.apply();
			this.show();
		
		},


		repositionThumb: function(scroll) {

			scroll = Math.max(0, scroll);
			scroll = Math.min(1, scroll);

			var min = this._trackRect.top + this._thumbRect.height();
			var max = this._trackRect.bottom;

			this._thumbRect.moveBottom(min + (max - min) * scroll);

			this._thumb.css({top: this._thumbRect.toRelative().top});

		},


		/**
		 * Scroll by a positive or negative amount of pixels
		 *
		 * @param val {Number} +/- pixel value
		 */
		scrollBy: function(val) {


			var offset_top = parseInt(this._inner.css('top'), 10) || 0;
			offset_top -= val;
			this.scrollTo(offset_top);

		},


		/**
		 * the absolute form of scroll()
		 *
		 * @param val: percent between 0 and 1
		 */
		scrollPercent: function(val) {

			val = Math.max(0, val);
			val = Math.min(1, val);

			var min = 0;
			var max = this._innerRect.height() - this._rootRect.height();

			var offset_top = -1 * val * (max - min);
			this.scrollTo(offset_top);
		
		},


		scrollTo: function(val) {

			var min = -1 * (this._innerRect.height() - this._rootRect.height());
			var max = 0;

			val = Math.max(min, val);
			val = Math.min(max, val);

			this._innerRect.moveTop(val);
			this._inner.css({top: this._innerRect.top});
			//this._inner.css({top: val});
			//this._innerRect = this._inner.rect();

			var percent = val / min;
			this.repositionThumb(percent);
		
		},


		'{root} mouseenter': function(ev, tgt) {

			this.show();
		
		},


		'{root} mouseleave': function(ev, tgt) {

			if (!this._active) {
				return false;
			}

			var mouse = new Point(ev.pageX, ev.pageY);
			var rect = lang.clone(this._rootRect);
			rect.right = this._barRect.right;
			if (!rect.contains(mouse)) {
				this.hide();
			}
		
		},


		'{_bar} mouseleave': function(ev, tgt) {

			if (!this._active) {
				return false;
			}

			var mouse = new Point(ev.pageX, ev.pageY);
			var rect = lang.clone(this._barRect);
			rect.left = this._rootRect.left;
			rect.right -= 1;
			if (!rect.contains(mouse)) {
				this.hide();
			}
		
		},


		'{root} mousewheel': function(ev, tgt, delta) {

			if (!this._active) {
				return false;
			}

			this.scrollBy(-1 * delta * 50);

		},


		'{_bar} mousewheel': function(ev, tgt, delta) {

			if (!this._active) {
				return false;
			}

			this.scrollBy(-1 * delta * 50);

		},


		_dragThumbOrigin: null,
		_dragDelta: null,
		_dragging: false,


		'{_thumb} draginit': function(ev, tgt) {

			if (!this._active) {
				return false;
			}

			this._dragging = true;
			this._dragThumbOrigin = new Point(ev.pageX, ev.pageY);
			this._dragDelta = ev.pageY - this._thumbRect.top;
		
		},


		'{_thumb} drag': function(ev, tgt) {

			if (!this._active) {
				return false;
			}

			var mouse = new Point(ev.pageX, ev.pageY);

			this._thumbRect.moveTop(mouse.y - (this._dragDelta));

			var min = this._trackRect.top + this._thumbRect.height();
			var max = this._trackRect.bottom;

			var scroll = (this._thumbRect.bottom - min) / (max - min);

			this.scrollPercent(scroll);
		
		},


		'{_thumb} dragend': function(ev, tgt) {

			if (!this._active) {
				return false;
			}

			this._dragging = false;

			var mouse = new Point(ev.pageX, ev.pageY);
			var rect = this._rootRect.united(this._barRect);
			if (!rect.contains(mouse)) {
				this.hide();
			}
		
		},


		'{_bar} mousedown': function(ev, tgt) {

			if (!this._active) {
				return false;
			}

			if (ev.target === this._thumb[0]) {
				return false;
			}

			var mouse = new Point(ev.pageX, ev.pageY);

			if (mouse.y < this._thumbRect.top) {
				this.scrollBy(-150);
				return false;
			}

			if (mouse.y > this._thumbRect.bottom) {
				this.scrollBy(150);
				return false;
			}
		
		},


/*
 *        _grabbing: false,
 *        _grabOrigin: null,
 *        _grabOffsetOrigin: null,
 *
 *
 *        '{root} draginit _data': {
 *            which: 2,
 *            distance: 5
 *        },
 *
 *
 *        '{root} draginit': function(ev, tgt) {
 *
 *            this._grabbing = true;
 *            this._grabOrigin = new Point(ev.pageX, ev.pageY);
 *            this._grabOffsetOrigin = this._innerRect.top;
 *        
 *        },
 *
 *
 *        '{root} drag': function(ev, tgt) {
 *
 *            var mouse = new Point(ev.pageX, ev.pageY);
 *            var delta = mouse.y - this._grabOrigin.y;
 *            var scroll = this._grabOffsetOrigin + delta;
 *            this.scrollTo(scroll);
 *        
 *        },
 */


		'{root} swipemove': function(ev, tgt) {

			//alert('test');
			//alert(dojo.toJson(ev));
			console.log(ev);
		
		}






	});

});
