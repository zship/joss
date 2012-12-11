define(function() {

	var xtor = function() {};


	// return a new object that inherits from ctor.prototype but without
	// actually running ctor on the object.
	var forceNew = function(ctor) {
		// create object with correct prototype using a do-nothing constructor
		xtor.prototype = ctor.prototype;
		var instance = new xtor();
		xtor.prototype = null;
		return instance;
	};


	return forceNew;

});
