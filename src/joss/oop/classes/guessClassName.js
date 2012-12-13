define(function() {

	var _hashCode = function(str){
		var hash = 0;

		if (str.length === 0) {
			return hash;
		}

		for (var i = 0; i < str.length; i++) {
			var char = str.charCodeAt(i);
			hash = ((hash<<5)-hash)+char;
			hash = hash & hash; // Convert to 32bit integer
		}

		return hash.toString();
	};


	var count = {};


	/*
	 * We can discern an appropriate className for a constructor in a somewhat
	 * hacky way given the following condition:
	 *  The result of the call to create() is assigned to a variable,
	 *  whose name we use as the class name
	 */
	var guessClassName = function(caller) {
		var sCaller = caller.toString();

		//store count of class declarations we have processed in `caller`'s
		//scope. this works because because create() calls will be executed in
		//order within the same `caller` scope
		var hash = _hashCode(sCaller);
		count[hash] = count[hash] || 0;

		//e.g. var (name) = Classes.create({...
		var rClassCreate = /\s*?(\S+?)\s*?=\s+?Classes\.create/;

		var matches = sCaller.match(new RegExp(rClassCreate.source, 'g'));
		if (matches && matches.length >= count[hash]) {
			var ret = matches[count[hash]].match(rClassCreate)[1];
			count[hash]++;
			return ret;
		}
		return 'Class';
	};


	return guessClassName;

});
