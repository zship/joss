define(function(require){

	var DomRect = require('joss/geometry/DomRect');
	var $ = require('jquery');



	module('joss/geometry/DomRect');

	test('Basics', function() {
		var fixture = $('#qunit-fixture');
		var fixtureOffset = fixture.offset();
		var el = $('<div></div>').appendTo('#qunit-fixture');
		el.css({
			position: 'absolute',
			top: 0,
			left: 0,
			width: 100,
			height: 100,
			border: '1px solid #000'
		});

		strictEqual(parseInt(el.css('top'), 10), 0, 'verify initial element top');
		strictEqual(parseInt(el.css('left'), 10), 0, 'verify initial element left');
		strictEqual(el.outerWidth(), 102, 'verify initial element width');
		strictEqual(el.outerHeight(), 102, 'verify initial element height');

		var rect = new DomRect({element: el});

		strictEqual(el.offset().top, fixtureOffset.top, 'creation: does not mutate DOM');
		strictEqual(el.offset().left, fixtureOffset.left, 'creation: does not mutate DOM');
		strictEqual(el.outerWidth(), 102, 'creation: does not mutate DOM');
		strictEqual(el.outerHeight(), 102, 'creation: does not mutate DOM');

		strictEqual(rect.top, fixtureOffset.top, 'creation: correct top calculated');
		strictEqual(rect.left, fixtureOffset.left, 'creation: correct left calculated');
		strictEqual(rect.width, 102, 'creation: correct width calculated');
		strictEqual(rect.height, 102, 'creation: correct height calculated');

		rect.translate(50, 50).apply();

		strictEqual(el.offset().top, fixtureOffset.top + 50, 'translate & apply: element top offet += 50');
		strictEqual(el.offset().left, fixtureOffset.left + 50, 'translate & apply: element left offet += 50');
		strictEqual(el.outerWidth(), 102, 'translate & apply: element width unchanged');
		strictEqual(el.outerHeight(), 102, 'translate & apply: element height unchanged');

		rect.width = 100;
		rect.height = 100;
		rect.apply();

		strictEqual(el.outerWidth(), 100, 'set width & apply: border-box used');
		strictEqual(el.outerHeight(), 100, 'set height & apply: border-box used');

		rect.border = {
			top: 1,
			right: 2,
			bottom: 3,
			left: 4
		};

		rect.padding = {
			top: 1,
			right: 2,
			bottom: 3,
			left: 4
		};

		rect.apply();

		strictEqual(parseInt(el.css('border-top-width'), 10), 1, 'set border-top & apply');
		strictEqual(parseInt(el.css('border-right-width'), 10), 2, 'set border-right & apply');
		strictEqual(parseInt(el.css('border-bottom-width'), 10), 3, 'set border-bottom & apply');
		strictEqual(parseInt(el.css('border-left-width'), 10), 4, 'set border-left & apply');

		strictEqual(parseInt(el.css('padding-top'), 10), 1, 'set padding-top & apply');
		strictEqual(parseInt(el.css('padding-right'), 10), 2, 'set padding-right & apply');
		strictEqual(parseInt(el.css('padding-bottom'), 10), 3, 'set padding-bottom & apply');
		strictEqual(parseInt(el.css('padding-left'), 10), 4, 'set padding-left & apply');
	});


	test('Applying to a different element', function() {
		var fixture = $('#qunit-fixture');
		var fixtureOffset = fixture.offset();

		var el = $('<div></div>').appendTo('#qunit-fixture');
		el.css({
			position: 'absolute',
			top: 0,
			left: 0,
			width: 100,
			height: 100,
			border: '1px solid #000'
		});

		var el2 = $('<div></div>').appendTo('#qunit-fixture');
		el2.css({
			position: 'absolute',
			top: 1,
			left: 1,
			width: 1,
			height: 1,
			border: '1px solid #000'
		});

		var rect = el.rect();

		rect.translate(50, 50);

		rect.border = {
			top: 1,
			right: 2,
			bottom: 3,
			left: 4
		};

		rect.padding = {
			top: 1,
			right: 2,
			bottom: 3,
			left: 4
		};

		rect.applyTo(el2);

		strictEqual(parseInt(el2.css('top'), 10), 50);
		strictEqual(parseInt(el2.css('left'), 10), 50);
		strictEqual(el2.outerWidth(), 112);
		strictEqual(el2.outerHeight(), 108);

		strictEqual(parseInt(el2.css('border-top-width'), 10), 1);
		strictEqual(parseInt(el2.css('border-right-width'), 10), 2);
		strictEqual(parseInt(el2.css('border-bottom-width'), 10), 3);
		strictEqual(parseInt(el2.css('border-left-width'), 10), 4);

		strictEqual(parseInt(el2.css('padding-top'), 10), 1);
		strictEqual(parseInt(el2.css('padding-right'), 10), 2);
		strictEqual(parseInt(el2.css('padding-bottom'), 10), 3);
		strictEqual(parseInt(el2.css('padding-left'), 10), 4);
	});

});
