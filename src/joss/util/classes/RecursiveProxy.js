define(function(require) {

	var TreeNode = require('./TreeNode');


	var RecursiveProxy = function(opts) {

		this._context = {};
		this._target = opts.target;
		this._prefix = opts.prefix || '';
		this._getter = opts.get;
		this._setter = opts.set;

		this._tree = opts.tree || TreeNode.fromObject(this._target);
		
		this._tree.forEach(function(node) {
			var key = node.key;
			var path = [this._prefix, node.path].filter(function(val) {
					return !!val;
				}).join('.');
			var descriptor = {};

			if (node.hasChildren()) {
				var proxy = new RecursiveProxy({
					target: this._target[key],
					prefix: this._prefix,
					tree: node,
					get: this._getter,
					set: this._setter
				});
				descriptor.get = function() {
					return proxy._context;
				};
			}
			else {
				descriptor.get = function() {
					return this._getter(key, path, this._target);
				}.bind(this);
			}

			descriptor.set = function(val) {
				var next = TreeNode.fromObject(val);

				//notify children in order from deepest to shallowest
				var updates = [];
				next.traverse(function(child) {
					if (child.data) {
						updates.unshift(child);
					}
				});

				updates.forEach(function(child) {
					//var prev = node.getNode(child.path).data;
					//var curr = merge(prev, child.data);
					var path = [this._prefix, node.path, child.path].filter(function(val) {
							return !!val;
						}).join('.');
					//console.log(path);
					this._setter(child.data, child.key, path, this._target);
				}.bind(this));

				//then notify the current root itself
				this._setter(val, key, path, this._target);
/*
 *
 *
 *                //we modified a property with children. notify children.
 *                if (node.hasChildren()) {
 *                    node.forEach(function(child) {
 *                        this._setter(val[child.key], child.key, path + '.' + child.key, this._target[key]);
 *                    }.bind(this));
 *                }
 */
			}.bind(this);

			Object.defineProperty(this._context, key, descriptor);
		}.bind(this));

	};


	RecursiveProxy.prototype.set = function(val) {
		var next = TreeNode.fromObject(val);
		//console.log(next);

		//notify children in order from deepest to shallowest
		var updates = [];
		next.traverse(function(child) {
			if (child.data) {
				updates.unshift(child);
			}
		});

		updates.forEach(function(child) {
			//var prev = node.getNode(child.path).data;
			//var curr = merge(prev, child.data);
			var path = [this._prefix, child.path].filter(function(val) {
					return !!val;
				}).join('.');
				//console.log(path, child.data);
			this._setter(child.data, child.key, path, this._target);
		}.bind(this));


		/*
		 *this._tree.forEach(function(node) {
		 *    var path = this._prefix ? this._prefix + '.' + node.key : node.key;
		 *    this._setter(val[node.key], node.key, path, this._target);
		 *}.bind(this));
		 */
	};


	return RecursiveProxy;

});
