'use strict';

var _ = require('lodash');
var obj = require('object-path');
var minimatch = require('minimatch');
var Asset = require('./Asset');
var traverse = require('traverse');
var path = require('path');
var helpers = require('./helpers');

/**
 * buildGlobs
 *
 * @class
 * @param {Object} file resources a map
 * @param {Object} a map of assets
 * @param {Array} bowerFiles an array bower component file paths
 * @param {Object} options
 *
 */
var buildGlobs = module.exports = function (resources, bowerFiles, options) {
	var _this = this;
	options = options || {};

	this.resources = resources;

	this.globs = {};

	_.forOwn(this.resources, function (resourceInfo, resourceType) {
		_this.globs[resourceType] = _this.getOutputFiles(resourceType, resourceInfo, bowerFiles);
	}, this);

	this.globs.bower = bowerFiles;
};

/**
 * getOutputFiles
 *
 * @param {String} resourceType
 * @param {Object} resourceInfo
 * @param {Array} bowerFiles an array bower component file paths
 * @return {undefined}
 */
buildGlobs.prototype.getOutputFiles = function (resourceType, resourceInfo, bowerFiles) {
	var outputFiles,
		_this = this;

	if (!this.resources)
		throw 'BuildGlob must be instantiated.';

	outputFiles = _.pickBy(resourceInfo.assets, function (asset, name) {
		return helpers.isDir(name) || minimatch(name, resourceInfo.pattern, { matchBase: true });
	});

	outputFiles = _.transform(outputFiles, function (result, asset, name) {
		// convert to an array of assetObjects
		var dep = new Asset(name, asset);
		var bower = [];
		var bowerExclude = _this.bowerExclude(resourceInfo.assets);

		if (asset.bower) {
			bower = bower.concat(
				_this.filterByType(
					_this.filterByPackage(bowerFiles, asset.bower),
					resourceType
				)
			);
		} else {
			if (asset.main) {
				bower = bower.concat(
					_this.filterByType(
						_this.rejectByPackage(bowerFiles, bowerExclude),
						resourceType
					)
				);
			}
		}
		dep.prependGlobs(bower);
		result.push(dep);
	}, []);

	// if (outputFiles.length == 1 && helpers.isDir(outputFiles[0].name))
	// 	outputFiles = outputFiles[0];

	return outputFiles;
};

/**
 * filterByPackage
 *
 * @param {Array} files
 * @param {String|Array} names
 * @return {Array} files for a particular package name
 */
buildGlobs.prototype.filterByPackage = function (files, names, reject) {
	var method = reject ? 'reject' : 'filter';
	if (!_.isArray(names)) {
		names = [names];
	}
	return _[method](files, function (file) {
		return _.some(names, function (name) {
			return file.indexOf(
				path.normalize('/bower_components/' + name + '/')
			) > -1;
		});
	});
};

buildGlobs.prototype.rejectByPackage = function (files, names) {
	return buildGlobs.prototype.filterByPackage(files, names, true);
};

/**
 * filterByType
 *
 * @param {Array} files
 * @param {String} type
 * @return {Array} files for a particular type
 */
buildGlobs.prototype.filterByType = function (files, type) {
	return _.filter(files, minimatch.filter(this.resources[type].pattern, { matchBase: true }));
};

buildGlobs.prototype.bowerExclude = function (assets) {
	// resolve bower assets
	return traverse(assets).reduce(function (result) {
		var parentKey = obj.get(this, 'parent.key');
		if (this.isLeaf && parentKey === 'bower') {
			result.push(this.parent.node);
		}
		return _.flatten(result);
	}, []);
};
