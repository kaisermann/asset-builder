'use strict';

var _ = require('lodash');
var readManifest = require('./readManifest');
var processManifest = require('./processManifest');
var BuildGlobs = require('./buildGlobs');
var Asset = require('./Asset');
var mainBowerFiles = require('main-bower-files');

/**
 * Manifest
 *
 * @class
 * @param {String} path File path to the manifest JSON file
 * @param {Object} options
 * @property {Object} config the original config from the manifest JSON file
 * @property {Object} assets the original assets property from the manifest JSON file
 * @property {Object} globs [see buildGlobs.globs property]{@link module:lib/buildGlobs~buildGlobs}
 * @property {Object} paths
 * @property {Object} paths.source the path to the asset source directory. Includes a trailing slash.
 * @property {Object} paths.dist path to the build directory. Includes a trailing slash.
 */
var Manifest = module.exports = function (path, options) {
	var manifest = processManifest(readManifest(path));
	var bower = mainBowerFiles(_.pick(manifest.config, ['paths']));
	this.config = manifest.config;
	this.assets = manifest.assets;
	this.globs = new BuildGlobs(manifest.config.fileTypes, manifest.assets, bower, options).globs;
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
 * getAsset
 *
 * @param {String} name
 * @return {Object}
 */
Manifest.prototype.getAssetByName = function (name) {
	var mainFiles = [];
	_.forOwn(this.globs, function (val, key) {
		mainFiles = key === 'bower' ? mainFiles : mainFiles.concat(val);
	}, this);

	return _.find(mainFiles, { name: name });
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
 *	  "app.js": {
 *			files: [ "scripts/main.js" ],
 *			vendor: [ "vendor/hello-world.js" ]
 *	  }
 *   },
 *   "styles": {
 *		"app.css": {
 *			files: [ "styles/main.css" ],
 *			vendor: [ "vendor/hello-world.css" ]
 *		}
 *   }
 * }
 * // then
 * manifest.getProjectGlobs();
 * // will output
 * {
 *   "scripts": [
 *	 "scripts/main.js"
 *   ],
 *   "styles": [
 *	 "styles/main.css"
 *   ]
 * }
 */
Manifest.prototype.getProjectGlobs = function () {
	return _.reduce(this.assets, function (result, assets, assetType) {
		_.forEach(assets, function (asset, key) {
			var type = Asset.parseType(assetType);
			if (!_.isArray(result[type])) {
				result[type] = [];
			}
			result[type] = result[type].concat(asset.files);
		}, this);
		return result;
	}, {});
};
