define(function(require) {

	var isObject = require('amd-utils/lang/isObject');
	var forOwn = require('amd-utils/object/forOwn');


	var Observable = function(opts) {
		
		this._data = {
			context: {},
			target: opts.target,
			observers: []
		};

		forOwn(this._target, function(obj, key) {

			var descriptor = {};
			var hasChildren = isObject(obj) && Object.keys(obj).length;

			if (hasChildren) {
				var observable = new Observable({
					target: this._data.target[key]
				});
				descriptor.get = function() {
					return observable._data.context;
				};
			}
			else {
				descriptor.get = function() {
					return this._data.target[key];
				};
			}

			descriptor.set = function(val) {
				var prev = this._data.target[key];
				this._data.target[key] = val;

				//we modified a property with children. update children.
				if (hasChildren) {
					forOwn(obj, function(child, childKey) {
						obj[childKey] = val[childKey];
					});
				}

				this._data.observers.forEach(function(observer) {
					observer(key, val, prev);
				});
			};

			Object.defineProperty(this._data.context, key, descriptor);

		}.bind(this));

	};


	Object.defineProperty(Observable.prototype, 'observers', {
		get: function() {
			return this._data.observers;
		}
	});


	return Observable;

});
