define(function(require) {

	var isFunction = require('amd-utils/lang/isFunction');
	var forOwn = require('amd-utils/object/forOwn');


	var mixinMembers = function(proto, source) {
		forOwn(source, function(member, key) {
			if (!isFunction(member)) {
				proto[key] = member;
				return;
			}

			//_super technique from http://ejohn.org/blog/simple-javascript-inheritance/
			proto[key] = function() {
				var superFn = this.constructor._meta.superFn[key];
				if (superFn) {
					this._super = superFn.bind(this);
				}
				else {
					this._super = function() {};
				}
				var ret = member.apply(this, arguments);
				return ret;
			};
		});
	};


	return mixinMembers;

});
