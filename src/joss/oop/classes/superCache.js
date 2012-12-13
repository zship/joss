define(function(require) {

	var forOwn = require('amd-utils/object/forOwn');


	//cache of which base methods should be used for each _super method, and in
	//what order (see superMethod.js)
	var superCache = function(members, bases) {
		var result = {};

		forOwn(members, function(member, key) {
			result[key] = [];
			bases.forEach(function(base) {
				if (!base._meta.members.hasOwnProperty(key)) {
					return;
				}

				var fn = base._meta.members[key];

				if (!fn) {
					return;
				}

				result[key].push(fn);
			});
		});

		return result;
	};


	return superCache;

});
