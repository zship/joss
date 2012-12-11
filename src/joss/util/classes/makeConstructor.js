define(function(require) {

	var applyNew = require('./applyNew');

	var makeConstructor = function(bases, ctor) {
		return function(other) {
			if(!(this instanceof arguments.callee)){
				// not called via new, so force it
				return applyNew(arguments);
			}

			//copy constructor for instances of this or any superclasses
			if (arguments.length === 1 && bases.concat(ctor).indexOf(other) !== -1) {
				this._data = other.clone()._data;
				return;
			}

			//special _data member of each class is, by convention, used to
			//hold all instance-specific "private" data. We declare/initialize
			//it here rather than on the prototype object to guarantee that
			//instances do not inadvertently modify the prototype object's
			//_data
			this._data = {};
			this._proxies = {};

			var args = arguments;
			bases.reverse().forEach(function(base) {
				base._meta.ctor.apply(this, args);
			}.bind(this));

			//give user the opportunity to override return value
			return ctor.apply(this, arguments);
		};
	};


	return makeConstructor;

});
