//a shim to load only the small parts of dojo that we use, skipping parts like
//the loader and DOM manipulation 
//returns the usual dojo object (just smaller)
define([
	//the main dojo object
	'dojo/_base/kernel',
	//mixin, isString, setObject, hitch...
	'dojo/_base/lang',
	//publish/subscribe
	'dojo/topic',
	//inheritance
	'dojo/_base/declare'
], function(dojo, lang, hub) {
	//add publish/subscribe to the main dojo object
	lang.mixin(dojo, hub);
	return dojo;
});
