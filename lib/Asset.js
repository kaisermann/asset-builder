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
var Asset = module.exports = function (outputName, assetInfo) {
    this.isDirectory = helpers.isDir(outputName);
    this.type = this.isDirectory ? 'directory' : Asset.parseType(outputName);
    this.resourceName = assetInfo.type;
    this.outputName = outputName;
    this.globs = [].concat(
        (assetInfo.vendor || []),
        (assetInfo.files || [])
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
    return helpers.isDir(name) ? 'directory' : _.last(name.split('.'));
};
