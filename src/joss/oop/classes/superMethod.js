define(function() {

	//_super() method, taking advantage of the _meta.super cache for lookups
	var superMethod = function() {
		//keep a pointer to which base class we're operating on, so that
		//upstream _super calls are directed to methods higher in the chain
		this._superPointer = this._superPointer || 0;
		this._superPointer++;

		var key = superMethod.caller.nom;
		var cache = this.constructor._meta.superFn;
		var superFn = cache[key] && cache[key][this._superPointer - 1];

		if (!superFn) {
			var className = this.constructor._meta.name;
			var err = className + '#' + key + ': no method by this name in superclasses (';
			err += [className].concat(
				this.constructor._meta.bases.map(function(base) {
					return base._meta.name;
				})
			).join(' > ');
			err += ')';
			throw new Error(err);
		}

		var ret = superFn.apply(this, arguments);
		this._superPointer = 0;
		return ret;
	};


	return superMethod;

});
