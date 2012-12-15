var path = require('path');


var docdir = 'doc';
var cachedir = docdir + '/cache';


var constants = {
	docdir: path.resolve(process.cwd() + '/' + docdir),
	cachedir: path.resolve(process.cwd() + '/' + cachedir),
	rjs: path.resolve(process.cwd() + '/dist/lib/r.js'),
	fileHashesPath: path.resolve(process.cwd() + '/' + cachedir + '/cache.json'),
	jsdocExe: 'doc/lib/jsdoc/jsdoc'
};


module.exports = constants;
