define(function(require) {

	var toArray = require('amd-utils/lang/toArray');
	var waterfall = require('deferreds/waterfall');



	var chain = function(proto, bases, members, key, type) {

		//constructor, key, type (using meta-info in constructor)
		if (arguments.length === 3) {
			type = arguments[2];
			key = arguments[1];
			var constructor = arguments[0];
			proto = constructor.prototype;
			bases = constructor._meta.bases;
			members = constructor._meta.members;
			constructor._meta.chains[key] = type;
		}

		//first/last in the chain should be the object's own meta info
		bases = bases.slice(0); //don't modify passed bases
		bases.unshift({ //mimick a real constructor
			_meta: {
				members: members
			}
		});

		if (type === 'after') {
			bases = bases.reverse();
		}

		proto[key] = function() {
			var args = toArray(arguments);

			var methods = bases.map(function(base) {
				return base._meta.members[key].bind(this);
			}.bind(this));

			if (args.length) {
				//first argument is passed as an argument to the first
				//method
				methods.unshift(args);
			}

			return waterfall(methods);
		};

	};


	return chain;

});
