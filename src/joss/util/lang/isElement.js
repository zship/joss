define(function () {

	var isElement = function(obj) {
		return obj && typeof obj === "object" && obj.nodeType === 1 && typeof obj.nodeName==="string";
	};

	return isElement;

});
