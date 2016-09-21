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
var output2 = m('test/fixtures/phase.json', {
	paths: {
		bowerDirectory: 'test/tmp/bower_components',
		bowerJson: 'test/tmp/bower.json'
	}
});
//log(output2);
log(output2.getDependencyByName("app.css"));
