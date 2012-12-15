'use strict';


var util = require('./util.js');
var Types = require('./Types.js');


//finds the use of jsdoc longNames in descriptions and replaces them with links
//example: joss.mvc.Controller#bind -> [Controller.bind](link to joss.mvc.Controller#bind)
var transformLongNames = function(graph) {

	var sNamePath = '{(\\S*?)([#~\\.])(\\S*?)}';
	var rNamePath = new RegExp(sNamePath);
	var rNamePathGlobal = new RegExp(sNamePath, 'g');

	var sClassName = '{([^{]\\S*?)}';
	var rClassName = new RegExp(sClassName);
	var rClassNameGlobal = new RegExp(sClassName, 'g');

	//console.log(descriptions);

	util.getDescriptions(graph).forEach(function(obj) {

		var description = obj.description;
		var matches;
		
		//first, class name + member name
		
		//global matching will disregard capturing groups, so
		//capture the full matches and then iterate over all of
		//them, matching again.
		matches = description.match(rNamePathGlobal) || [];
		matches.forEach(function(match) {
			var submatches = match.match(rNamePath);

			var name = submatches[0];
			var typeName = submatches[1];
			var scope = submatches[2];
			var propName = submatches[3];

			var rName = new RegExp(name, 'g');

			var type = Types.getType(typeName, 'inside ' + obj.longName + ' description') || Types.defaultType(typeName);

			var longName = type.longName + scope + propName;
			var shortName = type.name + '.' + propName;

			if (type.link) {
				description = description.replace(rName, '<a href="/#/' + longName + '" title="' + longName + '">' + shortName + '</a>');
			}
			else {
				description = description.replace(rName, shortName);
			}
		});

		//then, just plain class names (no member name following)
		matches = description.match(rClassNameGlobal) || [];
		matches.forEach(function(match) {
			var submatches = match.match(rClassName);

			var typeName = submatches[1];
			var type = Types.getType(typeName, 'inside ' + obj.longName + ' description') || Types.defaultType(typeName);
			var title = type.longName;
			if (type.longName === type.name) {
				title = '';
			}

			var rName = new RegExp('{' + typeName + '}', 'g');

			if (type.link) {
				description = description.replace(rName, '<a href="' + type.link + '" title="' + title + '">' + type.name + '</a>');
			}
			else {
				description = description.replace(rName, typeName);
			}
		});

		obj.description = description;
	});

};


module.exports = transformLongNames;
