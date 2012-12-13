define(function(require) {

	var isObject = require('amd-utils/lang/isObject');
	var isFunction = require('amd-utils/lang/isFunction');
	var forOwn = require('amd-utils/object/forOwn');
	var toArray = require('amd-utils/lang/toArray');
	var objmerge = require('amd-utils/object/merge');
	var clone = require('amd-utils/lang/clone');


	//general-purpose tree data structure
	var TreeNode = function(key, data) {
		this.data = data || {};
		this.key = key;
		this._parent = null;
		this._children = {};
	};


	Object.defineProperty(TreeNode.prototype, 'parent', {
		get: function() {
			return this._parent;
		},
		set: function(val) {
			this._parent = val;
			val.children[this.key] = this;
		}
	});


	Object.defineProperty(TreeNode.prototype, 'path', {
		get: function() {
			return this.parents
				.map(function(node) {
					return node.key;
				})
				.concat(this.key)
				.filter(function(key) {
					return !!key;
				})
				.join('.');
		}
	});


	Object.defineProperty(TreeNode.prototype, 'parents', {
		get: function() {
			var result = [];
			var node = this;
			while (node._parent) {
				result.unshift(node._parent);
				node = node._parent;
			}
			return result;
		}
	});


	Object.defineProperty(TreeNode.prototype, 'children', {
		get: function() {
			return this._children;
		},
		set: function(val) {
			forOwn(val, function(child) {
				child.parent = this;
			}.bind(this));
		}
	});


	TreeNode.prototype.hasChildren = function() {
		return Object.keys(this.children).length > 0;
	};


	TreeNode.prototype.forEach = function(iterator) {
		forOwn(this.children, iterator);
	};


	var _mixin = function(target, source) {
		target = clone( arguments[0] );

		forOwn(source, function(obj, key) {
			var val = source[key];

			if (val === null || val === undefined) {
				return;
			}

			if (isObject(val) && isObject(target[key]) ){
				target[key] = _mixin(target[key], val);
			}
			else {
				target[key] = clone(val);
			}

		});

		return target;
	};


	TreeNode.merge = function(target) {
		var args = toArray(arguments);

		var iterator = args.slice(-1)[0];
		if (!isFunction(iterator)) {
			iterator = null;
		}

		var sources = args.slice(1);
		if (iterator) {
			sources.pop();
		}

		var srcQueue = [];
		for (var i = 0; i < sources.length; i++) {
			var tgtQueue = [];
			tgtQueue.unshift(target);

			srcQueue[i] = [];
			srcQueue[i].unshift(sources[i]);

			while (srcQueue[i].length !== 0) {
				var src = srcQueue[i].pop();
				var tgt = tgtQueue.pop();

				if (iterator) {
					iterator(tgt, src);
				}
				else {
					tgt.data = objmerge(tgt.data, src.data);
				}

				var keys = Object.keys(src.children);
				for (var j = 0; j < keys.length; j++) {
					var key = keys[j];
					srcQueue[i].unshift(src.children[key]);

					if (!tgt.children[key]) {
						var node = new TreeNode(key, {});
						node.parent = tgt;
						tgtQueue.unshift(node);
					}
					else {
						tgtQueue.unshift(tgt.children[key]);
					}
				}
			}
		}

		return target;
	};


	//breadth-first traversal
	TreeNode.prototype.traverse = function(iterator) {
		var queue = [];
		queue.unshift(this);

		while (queue.length !== 0) {
			var node = queue.pop();

			iterator(node);

			var keys = Object.keys(node.children);
			for (var i = 0; i < keys.length; i++) {
				var key = keys[i];
				queue.unshift(node.children[key]);
			}
		}
	};


	//find by key using dot-separated strings e.g. 'a.b.c'
	TreeNode.prototype.getNode = function(path, create) {
		path = path || '';
		var parts = path.split('.');
		var context = this;

		for (var i = 0; i < parts.length; i++) {
			var part = parts[i];
			var node;

			if (!context) {
				return;
			}

			if ((node = context.children[part])) {
				context = node;
				continue;
			}

			//if we got here, no node exists at the current path.
			if (create !== true) {
				return;
			}

			node = new TreeNode(part);
			node.parent = context;
			context = node;
		}

		return context;
	};


	//set by key using dot-separated strings e.g. 'a.b.c'
	TreeNode.prototype.setNode = function(path, data) {
		path = path || '';
		var node = this.getNode(path, true);
		node.data = data;
		return node;
	};


	TreeNode.fromObject = function(obj) {
		var node = new TreeNode();
		node.data = {value: obj};

		if (!isObject(obj)) {
			return node;
		}

		forOwn(obj, function(val, key) {
			var child = new TreeNode();
			child.key = key;
			child.data = {value: val};

			if (isObject(val)) {
				child.children = TreeNode.fromObject(val).children;
			}

			child.parent = node;
		});
		return node;
	};


	return TreeNode;

});
