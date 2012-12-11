define(function(require) {

	var RecursiveProxy = require('./RecursiveProxy');


	var _defineProxy = function(context, name) {
		return new RecursiveProxy({
			target: context._data[name] || {},
			prefix: name,
			get: function(key, path, target) {
				var descriptors = this.constructor._meta.descriptors;
				if (descriptors[path] && descriptors[path].get) {
					return descriptors[path].get.call(context);
				}
				return target[key];
			}.bind(context),
			set: function(val, key, path, target) {
				var descriptors = this.constructor._meta.descriptors;
				if (descriptors[path] && descriptors[path].set) {
					descriptors[path].set.call(context, val, key);
					return;
				}
				target[key] = val;
			}.bind(context)
		});
	};


	var defineProp = function(proto, name, descriptor) {
		//constructor, name (using cached values on constructor for descriptor)
		if (arguments.length === 2) {
			var constructor = proto;
			proto = constructor.prototype;
			descriptor = constructor._meta.descriptors[name] = constructor._meta.descriptors[name] || {};
		}

		proto._proxies = proto._proxies || {};

		//if any properties have '.' in the name, they'll be accessed through a
		//RecursiveProxy (so that child Object.defineProperty properties are
		//not overwritten when setting values of parents)
		if (descriptor.hasChildren) {
			descriptor.get = function() {
				this._proxies[name] = this._proxies[name] || _defineProxy(this, name);
				return this._proxies[name]._context;
			};

			descriptor.set = function(val) {
				this._proxies[name] = this._proxies[name] || _defineProxy(this, name);
				this._proxies[name].set(val);
			};
		}

		Object.defineProperty(proto, name, {
			get: descriptor.get || function() {
				return this._data[name];
			},
			set: descriptor.set || function(val) {
				this._data[name] = val;
			}
		});

	};


	return defineProp;

});
