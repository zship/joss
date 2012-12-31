define(function(require){

	var setStyles = require('joss/util/elements/setStyles');
	var getDimensions = require('joss/util/elements/getDimensions');
	var $ = require('jquery');


	module('joss/util/elements/setStyles');


	test('basics', function() {
		var el = $('<div></div>').appendTo('#qunit-fixture');

		var dim = getDimensions(el[0]);

		deepEqual(dim, {
			'positioning': 'static',
			'precedence': {
				'x': 'left',
				'y': 'top'
			},
			'offset': {
				'top': -10000,
				'left': -10000
			},
			'border': {
				'top': 0,
				'bottom': 0,
				'left': 0,
				'right': 0
			},
			'margin': {
				'top': 0,
				'bottom': 0,
				'left': 0,
				'right': 0
			},
			'padding': {
				'top': 0,
				'bottom': 0,
				'left': 0,
				'right': 0
			},
			'position': {
				'top': 0,
				'left': 0,
				'right': 0,
				'bottom': -1000
			},
			'width': 1000,
			'height': 0
		});


		setStyles(el[0], {
			position: 'absolute',
			top: 0,
			left: 0,
			width: 100,
			height: 100,
			'borderStyle': 'solid',
			'borderTopWidth': 1,
			'borderRightWidth': 2,
			'borderBottomWidth': 3,
			'borderLeftWidth': 4,
			'paddingTop': 5,
			'paddingRight': 6,
			'paddingBottom': 7,
			'paddingLeft': 8,
			'marginTop': 9,
			'marginRight': 10,
			'marginBottom': 11,
			'marginLeft': 12
		});

		dim = getDimensions(el[0]);

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
	});

});
