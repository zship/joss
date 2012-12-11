define(function(require) {

	var forceNew = require('./forceNew');


	// just like 'new ctor()' except that the constructor and its arguments come
	// from args, which must be an array or an arguments object
	var applyNew = function(args) {
		var ctor = args.callee;
		var instance = forceNew(ctor);
		// execute the real constructor on the new object
		ctor.apply(instance, args);
		return instance;
	};


	return applyNew;

});
