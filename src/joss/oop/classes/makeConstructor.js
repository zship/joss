define(function(require) {

	var forceNew = require('./forceNew');


	var fn = function(bases, ctor) {
		return function(other) {
			//this following is eval'd from joss/oop/classes/makeConstructor,
			//in order to override the constructor name given in common
			//debuggers
			//more: http://stackoverflow.com/questions/8073055/minor-drawback-with-crockford-prototypical-inheritance/8076515
		
			if(!(this instanceof arguments.callee)){
				// not called via new, so force it
				var instance = forceNew(arguments.callee);
				arguments.callee.apply(instance, arguments);
				return instance;
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

			if (!ctor) {
				return;
			}

			//give user the opportunity to override return value
			return ctor.apply(this, arguments);
		};
	};


	var makeConstructor = function(className, bases, ctor) {
		return eval('1&&function ' + className + fn(bases, ctor).toString().replace(/^function\s+/, ''));
	};


	return makeConstructor;

});
