define(function(require){

	var Position = require('joss/geometry/Position');


	module('joss/geometry/Position');


	test('constructor', function() {
		var pos = new Position({
			x: 'left',
			y: 'top',
			precedence: 'x'
		});
		var pass = (pos.x === 'left' && pos.y === 'top' && pos.precedence === 'x');
		ok(pass, 'constructor with options object sets values correctly');

		pos = new Position('left top');
		pass = (pos.x === 'left' && pos.y === 'top' && pos.precedence === 'x');
		ok(pass, 'constructor with string arg sets values correctly');
	});


	test('reverse', function() {
		[
			//input string, result.reverse() {x, y}
			['top',           {x: 'center', y: 'bottom' }],
			['top center',    {x: 'center', y: 'bottom' }],
			['top left',      {x: 'right',  y: 'bottom' }],
			['top right',     {x: 'left',   y: 'bottom' }],
			['right',         {x: 'left',   y: 'center' }],
			['right center',  {x: 'left',   y: 'center' }],
			['right top',     {x: 'left',   y: 'bottom' }],
			['right bottom',  {x: 'left',   y: 'top'    }],
			['bottom',        {x: 'center', y: 'top'    }],
			['bottom center', {x: 'center', y: 'top'    }],
			['bottom left',   {x: 'right',  y: 'top'    }],
			['bottom right',  {x: 'left',   y: 'top'    }],
			['left',          {x: 'right',  y: 'center' }],
			['left center',   {x: 'right',  y: 'center' }],
			['left top',      {x: 'right',  y: 'bottom' }],
			['left bottom',   {x: 'right',  y: 'top'    }],
			['center',        {x: 'center', y: 'center' }],
			['center center', {x: 'center', y: 'center' }],
			['center top',    {x: 'center', y: 'bottom' }],
			['center right',  {x: 'left',   y: 'center' }],
			['center bottom', {x: 'center', y: 'top'    }],
			['center left',   {x: 'right',  y: 'center' }]
		].forEach(function(arr) {
			var input = arr[0];
			var result = arr[1];

			var pos = Position.fromString(input);
			var rev = pos.reverse();
			var pass = (rev.x === result.x && rev.y === result.y && rev.precedence === pos.precedence);
			ok(pass, 'reverse {x: ' + pos.x + ', y: ' + pos.y + '} = {x: ' + rev.x + ', y: ' + rev.y + '} and does not change precedence');
		});
	});


	test('fromString', function() {
		[
			//input string, result {x, y, precedence}
			['top',           {x: 'center', y: 'top',    p: 'y'}],
			['top center',    {x: 'center', y: 'top',    p: 'y'}],
			['top left',      {x: 'left',   y: 'top',    p: 'y'}],
			['top right',     {x: 'right',  y: 'top',    p: 'y'}],
			['right',         {x: 'right',  y: 'center', p: 'x'}],
			['right center',  {x: 'right',  y: 'center', p: 'x'}],
			['right top',     {x: 'right',  y: 'top',    p: 'x'}],
			['right bottom',  {x: 'right',  y: 'bottom', p: 'x'}],
			['bottom',        {x: 'center', y: 'bottom', p: 'y'}],
			['bottom center', {x: 'center', y: 'bottom', p: 'y'}],
			['bottom left',   {x: 'left',   y: 'bottom', p: 'y'}],
			['bottom right',  {x: 'right',  y: 'bottom', p: 'y'}],
			['left',          {x: 'left',   y: 'center', p: 'x'}],
			['left center',   {x: 'left',   y: 'center', p: 'x'}],
			['left top',      {x: 'left',   y: 'top',    p: 'x'}],
			['left bottom',   {x: 'left',   y: 'bottom', p: 'x'}],
			['center',        {x: 'center', y: 'center', p: 'x'}],
			['center center', {x: 'center', y: 'center', p: 'x'}],
			['center top',    {x: 'center', y: 'top',    p: 'x'}],
			['center right',  {x: 'right',  y: 'center', p: 'y'}],
			['center bottom', {x: 'center', y: 'bottom', p: 'x'}],
			['center left',   {x: 'left',   y: 'center', p: 'y'}]
		].forEach(function(arr) {
			var input = arr[0];
			var result = arr[1];

			var pos = Position.fromString(input);
			var pass = (pos.x === result.x && pos.y === result.y && pos.precedence === result.p);
			ok(pass, 'fromString("' + input + '") correct');
		});

		var pos = Position.fromString('left middle');
		var pass = (pos.x === 'left' && pos.y === 'center' && pos.precedence === 'x');
		ok(pass, '"left middle" == "left center"');

		pos = Position.fromString('left foo');
		pass = (pos.x === 'left' && pos.y === 'center' && pos.precedence === 'x');
		ok(pass, '"left foo" == "left center"');
	});


});
