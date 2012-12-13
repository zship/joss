define(function(require) {

	var ObjectProxy = require('joss/util/ObjectProxy');
	var forOwn = require('amd-utils/object/forOwn');


	var _defineProxy = function(context, descriptors) {
		return new ObjectProxy({
			context: context,
			target: context._data,
			descriptors: descriptors
		});
	};


	//clone descriptors, because ObjectProxy binds them to the `context` object
	var _clone = function(descriptors) {
		var result = {};
		Object.keys(descriptors).forEach(function(key) {
			var descriptor = descriptors[key];
			result[key] = {
				get: descriptor.get,
				set: descriptor.set
			};
		});
		return result;
	};


	var defineProps = function(proto, descriptors) {

		//if any properties have '.' in the name, they'll be accessed through an
		//ObjectProxy
		forOwn(descriptors, function(descriptor, name) {
			var children = Object.keys(descriptors).filter(function(key) {
				return (key.search(new RegExp('^' + name + '\\.')) !== -1);
			});

			if (children.length !== 0) {
				descriptor.hasChildren = true;
			}

			delete proto[name];
		});

		//make properties for direct children of proto, and proxies for deeper
		//children
		Object.keys(descriptors).filter(function(key) {
			return key.search(/\./) === -1;
		}).forEach(function(key) {

			var descriptor = descriptors[key];

			if (descriptor.hasChildren) {
				descriptor.get = function() {
					this._proxy = this._proxy || _defineProxy(this, _clone(descriptors));
					return this._proxy[key];
				};

				descriptor.set = function(val) {
					this._proxy = this._proxy || _defineProxy(this, _clone(descriptors));
					this._proxy[key]._set(val);
				};
			}

			Object.defineProperty(proto, key, {
				get: descriptor.get || function() {
					return this._data[key];
				},
				set: descriptor.set || function(val) {
					this._data[key] = val;
				}
			});
		});

	};


	return defineProps;

});
