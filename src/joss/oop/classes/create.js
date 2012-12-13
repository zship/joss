define(function(require) {

	var toArray = require('amd-utils/lang/toArray');
	var isString = require('amd-utils/lang/isString');
	var forOwn = require('amd-utils/object/forOwn');
	var merge = require('amd-utils/object/merge');
	var methodResolutionOrder = require('./methodResolutionOrder');
	var mixinMembers = require('./mixinMembers');
	var detectAccessors = require('./detectAccessors');
	var defineProps = require('./defineProps');
	var chain = require('./chain');
	var makeConstructor = require('./makeConstructor');
	var cloneMethod = require('./cloneMethod');
	var superMethod = require('./superMethod');
	var superCache = require('./superCache');
	var guessClassName = require('./guessClassName');


	/**
	 * @param {String} [className]
	 * @param {...Constructor} [superclasses]
	 * @param {Object} members
	 * @return {Constructor}
	 */
	var create = function() {

		var args = toArray(arguments);
		var className;
		var superclasses = [];
		var members;

		if (isString(args[0])) {
			className = args[0];
			args.shift();
		}

		if (args[0]._meta) {
			superclasses = args.slice(0, -1);
			args = args.slice(-1);
		}

		members = args[0];


		/*
		 * ----------------------------------------------------------------------
		 * Step 1:
		 * Determine inheritance heirarchy and store linearized version in
		 * `bases`, in order from subclass to superclass.
		 * ----------------------------------------------------------------------
		 */
		var bases = [];

		if (superclasses.length === 1) {
			var superclass = superclasses[0];
			bases = [superclass].concat(superclass._meta.bases);
		}
		else if (superclasses.length > 1) {
			//methodResolutionOrder works on constructors. pass an object
			//mimicking a real constructor
			bases = methodResolutionOrder({
				_meta: {
					bases: superclasses
				}
			});
			bases.shift(); //first result is the constructor itself
		}


		/*
		 * ----------------------------------------------------------------------
		 * Step 2:
		 * Build prototype by mixing-in members in `bases`, and then mixing-in
		 * passed `members`
		 * ----------------------------------------------------------------------
		 */
		var proto = {};

		bases.slice(0).reverse().forEach(function(base) {
			mixinMembers(proto, base._meta.members);
		});

		mixinMembers(proto, members);


		/*
		 * ----------------------------------------------------------------------
		 * Step 3:
		 * Gather introspection info in the `meta` variable. This will be added
		 * to the final constructor.
		 * ----------------------------------------------------------------------
		 */
		var meta = {};
		meta.bases = bases;
		meta.members = members;
		meta.ctor = members.hasOwnProperty('constructor') ? members.constructor : function() {};

		//keep the className for error messages and forceNew.js
		if (className) {
			guessClassName(create.caller, meta.bases, true);
		}
		meta.name = className || guessClassName(create.caller, meta.bases);

		//cache of which base methods should be used for each _super method (see superMethod.js)
		meta.superFn = superCache(meta.members, meta.bases);

		//which methods on superclasses should be chained (see chain.js)
		meta.chains = {};
		meta.bases.slice(0).reverse().forEach(function(base) {
			meta.chains = merge(meta.chains, base._meta.chains);
		});

		//cache of (property name) => {get: fn, set: fn} descriptor
		meta.descriptors = {};
		meta.bases.slice(0).reverse().forEach(function(base) {
			meta.descriptors = merge(meta.descriptors, base._meta.descriptors);
		});
		meta.descriptors = merge(meta.descriptors, detectAccessors(proto));


		/*
		 * ----------------------------------------------------------------------
		 * Step 4:
		 * Modifications to the prototype, using `meta` info: default clone(),
		 * _super(), inherited chains, es5 properties
		 * ----------------------------------------------------------------------
		 */
		proto.clone = members.clone || cloneMethod;
		proto._super = superMethod;

		forOwn(meta.chains, function(type, key) {
			chain(proto, meta.bases, members, key, type);
		});

		defineProps(proto, meta.descriptors);


		/*
		 * ----------------------------------------------------------------------
		 * Step 5:
		 * Build the constructor function, add `meta` info, and link the
		 * prototype
		 * ----------------------------------------------------------------------
		 */
		var constructor = makeConstructor(meta.name, meta.bases, meta.ctor);
		constructor._meta = meta;
		constructor.prototype = proto;
		proto.constructor = constructor;
		//extend() is just a curried version of create()
		constructor.extend = create.bind(create, constructor);
		return constructor;

	};


	return create;

});
