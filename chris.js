/* jshint node: true */
/* global describe, it, beforeEach */
'use strict';
var chai = require('chai');
var assert = chai.assert;
var fs = require('fs');
var m = require('./index');
var readManifest = require('./lib/readManifest');
var processManifest = require('./lib/processManifest');
var buildGlobs = require('./lib/buildGlobs');
var Dependency = require('./lib/Dependency');
var bower = require('bower');
var Q = require('q');
var mkdirp = require('mkdirp');
var _ = require('lodash');
var path = require('path');
var util = require('util');

var log = function (o, m) {
	m && console.log('>>' + m);
	console.log('-----\n' + util.inspect(o, false, null) + '\n-----');
}

//var test = readManifest('test/fixtures/phase.json');
//var test2 = processManifest(test);
//console.log(test2);
// var output = m('test/fixtures/phase.json', {
// 	paths: {
// 		bowerDirectory: 'test/tmp/bower_components',
// 		bowerJson: 'test/tmp/bower.json'
// 	}
// });
//log(output);
//log(output.getProjectGlobs());
// var output2 = m('test/fixtures/sage.json', {
// 	paths: {
// 		bowerDirectory: 'test/tmp/bower_components',
// 		bowerJson: 'test/tmp/bower.json'
// 	}
// });
// log(output2);

// var css = output.getDependencyByName.call(output.globs, 'main.css');
// var js = output.getDependencyByName.call(output.globs, 'set.js');
// log(css);
// log(js);
var mockBower = [
	"/asset-builder/bower_components/jquery/dist/jquery.js",
	"/asset-builder/bower_components/bootstrap/js/transition.js",
	"/asset-builder/bower_components/bootstrap/js/alert.js",
];

var expected = [{
	type: 'js',
	name: 'app.js',
	globs: [
		path.normalize("/asset-builder/bower_components/bootstrap/js/transition.js"),
		path.normalize("/asset-builder/bower_components/bootstrap/js/alert.js"),
		"path/to/script.js"
	]
},
	{
		type: 'js',
		name: 'jquery.js',
		globs: [
			path.normalize("/asset-builder/bower_components/jquery/dist/jquery.js"),
		]
				}
];
var defaultTypes = {
	"fonts": "*.{eot,otf,svg,ttc,ttf,woff,woff2}",
	"scripts": "*.js",
	"styles": "*.css",
	"images": "*.{jpg,png,gif}"
}
var buildGlob = new buildGlobs(defaultTypes, {
	"scripts": {
		"app.js": {
			files: ['path/to/script.js'],
			main: true
		},
		"jquery.js": {
			bower: ['jquery']
		}
	}
}, mockBower);
