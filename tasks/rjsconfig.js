module.exports = {

	baseUrl: 'src',

	optimize: 'none',

	packages: [
		{ name: 'dojo', location: 'lib/dojo' },
		{ name: 'jade', location: 'lib/jade' }
	],

	paths: {
		//dojo's i18n module doesn't build with r.js (errors out)
		'dojo/i18n': '../dist/lib/i18n-patched',
		'jquery': 'lib/jquery',
		'jquery.hashchange': 'lib/jquery.ba-hashchange',
		'jquery.mousewheel': 'lib/jquery.mousewheel',
		'jquery.event.drag': 'lib/jquery.event.drag-2.0',
		'jquery.event.input': 'lib/jquery.event.input',
		'jquery.jgestures': 'lib/jgestures'
	},

	keepBuildDir: true,

	locale: "en-us",

	useStrict: false,

	skipModuleInsertion: false,

	findNestedDependencies: false,

	removeCombined: false,

	preserveLicenseComments: false,

	//Sets the logging level. It is a number. If you want "silent" running,
	//set logLevel to 4. From the logger.js file:
	//TRACE: 0,
	//INFO: 1,
	//WARN: 2,
	//ERROR: 3,
	//SILENT: 4
	//Default is 0.
	logLevel: 0

};
