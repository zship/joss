define(function() {


	var _merge = function(seqs) {
		var result = [];

		while (true) {

			seqs = seqs.filter(function(seq) {
				return seq && seq.length;
			});

			if (!seqs.length) {
				return result;
			}

			var candidate;

			//find merge candidates among seq heads
			seqs.every(function(seq) {
				candidate = seq[0];

				//if the candidate is not in the tail of any other seqs
				var notHead = seqs.filter(function(seq) {
					var tail = seq.slice(1);
					return tail.indexOf(candidate) !== -1;
				}).length === 0;

				//reject candidate
				if (notHead) {
					candidate = null;
					return true; //continue
				}

				return false; //break
			});

			if (!candidate) {
				throw new Error('Inconsistent heirarchy');
			}

			result.push(candidate);

			//remove candidate
			seqs = seqs.map(function(seq) {
				if (seq[0] === candidate) {
					return seq.slice(1);
				}
				return seq;
			});

		}
	};


	// C3 Method Resolution Order (see http://www.python.org/download/releases/2.3/mro/)
	var mro = function(constructor){
		var bases = constructor._meta.bases;

		var seqs =
			[[constructor]]
			.concat(bases.map(function(base) {
				return mro(base);
			}))
			.concat([bases]);

		//the linearization of C is the sum of C plus the merge of the
		//linearizations of the parents and the list of the parents.
		return _merge(seqs);
	};


	return mro;

});
