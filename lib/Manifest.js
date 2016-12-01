'use strict';

var _ = require('lodash');
var readManifest = require('./readManifest');
var processManifest = require('./processManifest');
var BuildGlobs = require('./buildGlobs');
var mainBowerFiles = require('main-bower-files');
var mainNpmFiles = require('main-npm-files');
var path = require('path');

/**
 * Manifest
 *
 * @class
 * @param {String} path File path to the manifest JSON file
 * @param {Object} options
 *
 */
var Manifest = module.exports = function (path, options) {
  var manifest = processManifest(readManifest(path));
  manifest.config = _.merge(manifest.config, options);

  var cwd = process.cwd();
  var pkgs = {};
  try {
    pkgs.bower = mainBowerFiles(options).map(function (str) {
      return (str.indexOf(cwd) !== -1) ? '.' + str.slice(cwd.length) : str;
    });
  } catch (e) {
    console.log(e);
    pkgs.bower = [];
  }
  pkgs.npm = mainNpmFiles('**/*.*');

  this.config = manifest.config;
  this.resources = manifest.resources;

  this.globs = new BuildGlobs(manifest.resources, pkgs, manifest.config).globs;
};

/**
 * forEachAsset
 * loops through the assets of the specified type and calls the callback for each asset.
 *
 * @param {String} type The type of assets you want to loop through. These can be
 * @param {Function} callback Callback called per iteration with the arguments (value, index|key, collection)
 * @see {@link https://lodash.com/docs#forEach}
 */
Manifest.prototype.forEachAsset = function (type, callback) {
  _.forEach(this.globs[type], callback);
};

/**
 * getResource
 * Get a resource glob info by its single name or its name composed with its resource type name
 * Example:
 * "script": {
 *      assets:{
 *          "main.js": {}
 *      }
 * },
 * "images": {
 *      assets:{
 *          "/": {}
 *      }
 * }
 * main.js can be returned by looking for 'main.js' or 'scripts/main.js'
 * images globs can be returned by looking for 'images/'
 * @param {String} output name
 * @return {Object}
 */
Manifest.prototype.getAssetByOutputName = function (name) {
  var mainFiles = [];
  _.forOwn(this.globs, function (val, key) {
    mainFiles = key === 'bower' ? mainFiles : mainFiles.concat(val);
  }, this);

  var ret = _.find(mainFiles, function (o) {
    return o.outputName === name || name === path.join(o.resourceName, o.outputName);
  });

  // if (ret.type === 'directory')
  //     ret.outputName = ret.resourceName + ret.outputName;
  return ret;
};

/**
 * getProjectGlobs
 * gets
 *
 * @return {Object} returns an object with properties corresponding to
 * @example
 * // if you had a manifest with a assets property that looked like:
 * {
 *   "scripts": {
 *    "app.js": {
 *      files: [ "scripts/main.js" ],
 *      vendor: [ "vendor/hello-world.js" ]
 *    }
 *   },
 *   "styles": {
 *    "app.css": {
 *      files: [ "styles/main.css" ],
 *      vendor: [ "vendor/hello-world.css" ]
 *    }
 *   }
 * }
 * // then
 * manifest.getProjectGlobs();
 * // will output
 * {
 *   "scripts": [
 *   "scripts/main.js"
 *   ],
 *   "styles": [
 *   "styles/main.css"
 *   ]
 * }
 */
Manifest.prototype.getProjectGlobs = function () {
  return _.reduce(this.resources, function (result, resourceInfo, resourceType) {
    _.forEach(resourceInfo.assets, function (asset, key) {
      var type = resourceType;
      if (!_.isArray(result[type])) {
        result[type] = [];
      }
      result[type] = result[type].concat(asset.files);
    }, this);
    return result;
  }, {});
};
