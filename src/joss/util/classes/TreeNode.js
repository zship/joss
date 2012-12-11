define(function(require) {

	var isObject = require('amd-utils/lang/isObject');
	var forOwn = require('amd-utils/object/forOwn');


	//general-purpose tree data structure
	var TreeNode = function(key, data) {
		this.data = data;
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
			this.path = this.parents
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


	//breadth-first traversal
	TreeNode.prototype.traverse = function(iterator, level) {
		level = level || 0;
		var queue = [];
		queue.unshift(this);

		while (queue.length !== 0) {
			var node = queue.shift();
			iterator(node, level);
			level += 1;
			node.forEach(function(child) {
				queue.unshift(child);
			});
		}
	};


	//find by key using dot-separated strings e.g. 'a.b.c'
	TreeNode.prototype.getNode = function(path, create) {
		path = path || '';
		var parts = path.split('.');
		var context = this;

		for (var i = 0; i <= parts.length; i++) {
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

		if (!isObject(obj)) {
			return node;
		}

		forOwn(obj, function(val, key) {
			var child = new TreeNode();
			child.key = key;
			child.data = val;

			if (isObject(val)) {
				child.children = TreeNode.fromObject(val).children;
			}

			child.parent = node;
		});
		return node;
	};


	return TreeNode;

});
