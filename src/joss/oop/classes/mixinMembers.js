define(function(require) {

	var isFunction = require('amd-utils/lang/isFunction');
	var forOwn = require('amd-utils/object/forOwn');


	var mixinMembers = function(proto, source) {
		forOwn(source, function(member, key) {
			proto[key] = member;

			if (isFunction(member)) {
				//used for _super() (see superMethod.js)
				proto[key].nom = key;
			}
		});
	};


	return mixinMembers;

});
