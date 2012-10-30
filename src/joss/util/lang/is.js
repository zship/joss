define(function () {

	var is = function(obj, constructor) {
		return obj && obj.constructor && obj.constructor === constructor;
	};

	return is;

});
