define(function(require) {

	var clone = require('amd-utils/lang/clone');
	var forceNew = require('./forceNew');


	//default clone() method, by convention cloning the _data property
	var cloneMethod = function() {
		var ret = forceNew(this.constructor);
		ret._data = clone(this._data);
		return ret;
	};


	return cloneMethod;

});
