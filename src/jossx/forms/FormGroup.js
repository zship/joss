/*
 ---------------------------------------------------
 FormGroup

 Grouping inputs for the purpose of enforcing operating
 on one group at a time

 Mostly thin wrappers around FormToggle methods,
 just ensuring one-at-a-time editing
 ---------------------------------------------------
 */
define(function(require) {

	var $ = require('jquery');
	var declare = require('dojo/_base/declare');
	require('./FormToggle');



	var FormGroup = declare(null, {

		constructor: function(selector, opts) {
			this.selector = selector;
			this.options = $.extend(true, {}, {
				onEnable: function() {},
				beforeDisable: function() {},
				onDisable: function() {}
			}, opts);
		},

		selector: null,

		options: null,

		enable: function() {
			//already editing a group? Cancel and disable it.
			if (FormGroup.activeGroup !== null) {
				FormGroup.activeGroup.restore().disable();
			}

			FormGroup.activeGroup = this;
			this.selector.enable();
			this.options.onEnable.call(this.selector, this);

			return this;
		},

		restore: function() {
			this.selector.restore();
			return this;
		},

		disable: function(invalidate) {
			if (FormGroup.activeGroup === this) {
				FormGroup.activeGroup = null;
			}
			if (this.options.beforeDisable.call(this.selector, this) === false) {
				return this;
			}
			this.selector.disable(invalidate);
			this.options.onDisable.call(this.selector, this);
			return this;
		}

	});


	FormGroup.activeGroup = null;


	$.fn.group = function(opts) {
		//traverse parents looking for a defined group
		var g = null;
		var parents = this.parents().get();
		parents.unshift(this[0]);
		parents.forEach(function(el) {
			var data = $.data(el, 'group');
			if (data !== undefined) {
				g = data;
				return false;
			}
		});

		if (g) {
			return g;
		}

		//no group? define a new one
		g = new FormGroup(this, opts);
		this.data('group', g);
		return g;
	};


	return FormGroup;

});
