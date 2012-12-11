define(function(require) {

	var isArray = require('amd-utils/lang/isArray');
	var forOwn = require('amd-utils/object/forOwn');
	var merge = require('amd-utils/object/merge');
	var methodResolutionOrder = require('./mro');
	var mixinMembers = require('./mixinMembers');
	var detectAccessors = require('./detectAccessors');
	var defineProp = require('./defineProp');
	var chain = require('./chain');
	var makeConstructor = require('./makeConstructor');
	var forceNew = require('./forceNew');


	var create = function(superclasses, members) {

		if (members === undefined) {
			members = superclasses;
			superclasses = [];
		}

		if (!isArray(superclasses)) {
			superclasses = [superclasses];
		}


		//meta contains introspection info; it will be added to the returned
		//constructor
		var meta = {};
		meta.members = members;


		//bases is an array of ancestors, in order from subclass to superclass
		meta.bases = [];

		if (superclasses.length === 1) {
			var superclass = superclasses[0];
			meta.bases = [superclass].concat(superclass._meta.bases);
		}
		else if (superclasses.length > 1) {
			//methodResolutionOrder works on constructors. pass an object
			//mimicking a real constructor
			meta.bases = methodResolutionOrder({
				_meta: {
					bases: superclasses
				}
			});
		}


		//build prototype from members in meta.bases, and then from passed members
		var proto = {};

		meta.bases.reverse().forEach(function(base) {
			mixinMembers(proto, base._meta.members);
		});

		mixinMembers(proto, members);


		//cache of which base should be used for each _super method
		meta.superFn = {};

		meta.bases.forEach(function(base) {
			forOwn(base._meta.members, function(member, key) {
				if (members[key] && !meta.superFn[key]) {
					meta.superFn[key] = member;
				}
			});
		});


		//which methods on superclasses should be chained (see chain.js)
		meta.chains = {};

		meta.bases.reverse().forEach(function(base) {
			meta.chains = merge(meta.chains, base._meta.chains);
		});

		forOwn(meta.chains, function(type, key) {
			chain(proto, meta.bases, members, key, type);
		});


		//cache of (property name) => {get: fn, set: fn}
		meta.descriptors = {};

		meta.bases.reverse().forEach(function(base) {
			meta.descriptors = merge(meta.descriptors, base._meta.descriptors);
		});

		meta.descriptors = merge(meta.descriptors, detectAccessors(proto));

		forOwn(meta.descriptors, function(descriptor, name) {
			defineProp(proto, name, descriptor);
		});


		//default clone() method, by convention cloning the _data property
		proto.clone = members.clone || function() {
			var ret = forceNew(this.constructor);
			ret._data = merge(this._data);
			return ret;
		};


		//finally, build the constructor function
		meta.ctor = members.hasOwnProperty('constructor') ? members.constructor : function() {};
		var constructor = makeConstructor(meta.bases, meta.ctor);
		constructor._meta = meta;
		constructor.prototype = proto;
		proto.constructor = constructor;
		return constructor;

	};


	return create;

});
