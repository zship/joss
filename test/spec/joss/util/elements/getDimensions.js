define(function(require){

	var getDimensions = require('joss/util/elements/getDimensions');
	var $ = require('jquery');


	module('joss/util/elements/getDimensions');


	test('basics', function() {
		var el = $('<div></div>').appendTo('#qunit-fixture');
		el.css({
			position: 'absolute',
			top: 0,
			left: 0,
			width: 100,
			height: 100,
			'border-style': 'solid',
			'border-top-width': 1,
			'border-right-width': 2,
			'border-bottom-width': 3,
			'border-left-width': 4,
			'padding-top': 5,
			'padding-right': 6,
			'padding-bottom': 7,
			'padding-left': 8,
			'margin-top': 9,
			'margin-right': 10,
			'margin-bottom': 11,
			'margin-left': 12
		});

		var dim = getDimensions(el[0]);

		deepEqual(dim, {
			'positioning': 'absolute',
			'precedence': {
				'x': 'left',
				'y': 'top'
			},
			'offset': {
				'top': -9991,
				'left': -9988
			},
			'border': {
				'top': 1,
				'bottom': 3,
				'left': 4,
				'right': 2
			},
			'margin': {
				'top': 9,
				'bottom': 11,
				'left': 12,
				'right': 10
			},
			'padding': {
				'top': 5,
				'bottom': 7,
				'left': 8,
				'right': 6
			},
			'position': {
				'top': 0,
				'left': 0,
				'right': -880,
				'bottom': -884
			},
			'width': 100,
			'height': 100
		});


		//make positioning relative to bottom, right
		el.css({
			left: 'auto',
			right: 0,
			top: 'auto',
			bottom: 0
		});

		dim = getDimensions(el[0]);

		deepEqual(dim, {
			'positioning': 'absolute',
			'precedence': {
				'x': 'right',
				'y': 'bottom'
			},
			'offset': {
				'top': -9127,
				'left': -9130
			},
			'border': {
				'top': 1,
				'bottom': 3,
				'left': 4,
				'right': 2
			},
			'margin': {
				'top': 9,
				'bottom': 11,
				'left': 12,
				'right': 10
			},
			'padding': {
				'top': 5,
				'bottom': 7,
				'left': 8,
				'right': 6
			},
			'position': {
				'top': 864,
				'left': 858,
				'right': -22,
				'bottom': -20
			},
			'width': 100,
			'height': 100
		});

	});

});
