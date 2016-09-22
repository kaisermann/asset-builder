'use strict';

var _ = require('lodash');
var helpers = require('./helpers');

/**
 * Asset
 * creates an object to be consumed by external sources
 *
 * @class
 * @param {String} output
 * @param {Object} asset options object
 */
var Asset = module.exports = function (output, asset) {
	this.isDirectory = helpers.isDir(output);
	this.type = this.isDirectory ? 'directory' : Asset.parseType(output);
	this.output = output;
	this.globs = [].concat(
		(asset.vendor || []),
		(asset.files || [])
	);
};

/**
 * prependGlobs
 * Adds globs to the beginning of the Asset's globs property
 *
 * @param {Array} files Array of glob strings
 */
Asset.prototype.prependGlobs = function (files) {
	this.globs = [].concat(files, this.globs);
};

/**
 * parseType
 *
 * @param {String} name
 * @return {String}
 */
Asset.parseType = function (name) {
	return _.last(name.split('.'));
};
