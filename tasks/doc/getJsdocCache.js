'use strict';


var fs = require('fs');
var grunt = require('grunt/lib/grunt.js');
var _ = grunt.utils._;
var util = require('./util.js');
var constants = require('./constants.js');


var getJsdocCache = function(files) {

	var fileHashes = {};
	var staleFiles = [];
	var freshFiles = [];
	var cacheFiles = [];

	if (fs.existsSync(constants.fileHashesPath)) {
		fileHashes = JSON.parse(grunt.file.read(constants.fileHashesPath));

		staleFiles = _.chain(fileHashes).map(function(hash, filePath) {
			return {
				file: filePath,
				hash: hash
			};
		}).filter(function(obj) {
			var cur = util.hashFile(obj.file);
			var prev = obj.hash;
			return cur !== prev;
		}).pluck('file').value();
		freshFiles = _.difference(files, staleFiles);

		//marking new files stale
		var toRemove = [];
		freshFiles.forEach(function(filePath) {
			var module = util.fileToModuleName(filePath);
			var cachePath = constants.cachedir + '/' + module + '.json';

			if (!fs.existsSync(cachePath)) {
				staleFiles.push(filePath);
				toRemove.push(filePath);
			}
			else {
				cacheFiles.push(cachePath);
			}
		});
		freshFiles = _.difference(freshFiles, toRemove);
		//staleFiles = _.difference(files, freshFiles);
	}
	else {
		staleFiles = files.slice(0);
	}

	return {
		index: fileHashes,
		stale: staleFiles,
		fresh: cacheFiles
	};

};


module.exports = getJsdocCache;
