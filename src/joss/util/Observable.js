define(function(require) {

	var isObject = require('amd-utils/lang/isObject');
	var forOwn = require('amd-utils/object/forOwn');


	var Observable = function(opts) {

		if (!(opts.key && opts.parent && opts.target)) {
			var tgt = opts;
			opts = {};
			opts.target = tgt;
		}

		this._data = {
			key: opts.key,
			parent: opts.parent,
			target: opts.target,
			observers: []
		};

		forOwn(this._data.target, function(obj, key) {

			var descriptor = {};
			var hasChildren = isObject(obj) && Object.keys(obj).length;

			if (hasChildren) {
				var observable = new Observable({
					key: key,
					parent: this,
					target: this._data.target[key]
				});
				descriptor.get = function() {
					return observable;
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

				var root = this;
				var path = [key];
				while (true) {
					if (root._data.parent === undefined) {
						break;
					}
					path.unshift(root._data.key);
					root = root._data.parent;
				}

				root._data.observers.forEach(function(observer) {
					observer(root._data.target, path.join('.'), val, prev);
				}.bind(this));
			};

			Object.defineProperty(this, key, descriptor);

		}.bind(this));

	};


	Object.defineProperty(Observable.prototype, 'observers', {
		get: function() {
			return this._data.observers;
		}
	});


	return Observable;

});
