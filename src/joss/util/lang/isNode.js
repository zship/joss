define(function () {

	var isNode = function(obj) {
		return obj && typeof obj === "object" && typeof obj.nodeType === "number" && typeof obj.nodeName==="string";
	};

	return isNode;

});
