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
 * @param {Object} file types a map
 * @param {Object} assets a map of assets
 * @param {Array} bowerFiles an array bower component file paths
 * @param {Object} options
 *
 * @property {Object} globs the glob strings organized by type
 * @property {Object} globs.js an array of javascript Asset objects
 * @property {Object} globs.css an array of css Asset objects
 * @property {Object} globs.fonts an array of fonts path glob strings
 * @property {Object} globs.images an array of image path glob strings
 * @property {Object} globs.bower an array of bower component glob strings
 */
var buildGlobs = module.exports = function (types, assets, bowerFiles, options) {
	options = options || {};
	this.types = types;

	this.globs = {};
	_.forOwn(this.types, function (typeGlob, typeName) {
		this.globs[typeName] = this.getOutputFiles(typeName, typeGlob, assets, bowerFiles)
	}, this);

	this.globs.bower = bowerFiles;
};

/**
 * getOutputFiles
 *
 * @param {String} type
 * @param {Object} assets
 * @param {Array} bowerFiles an array bower component file paths
 * @return {undefined}
 */
buildGlobs.prototype.getOutputFiles = function (typeName, typeGlob, assets, bowerFiles) {
	var outputFiles;

	if (!this.types)
		throw 'BuildGlob must be instantiated.';

	outputFiles = _.pick(assets[typeName], function (asset, name) {
		return helpers.isDir(name) || minimatch(name, typeGlob);
	});

	outputFiles = _.transform(outputFiles, function (result, asset, name) {
		// convert to an array of assetObjects
		var dep = new Asset(name, asset);
		var bower = [];
		var bowerExclude = this.bowerExclude(assets[typeName]);

		if (asset.bower) {
			bower = bower.concat(
				this.filterByType(
					this.filterByPackage(bowerFiles, asset.bower),
					typeName
				)
			);
		} else {
			if (asset.main) {
				bower = bower.concat(
					this.filterByType(
						this.rejectByPackage(bowerFiles, bowerExclude),
						typeName
					)
				);
			}
		}

		dep.prependGlobs(bower);
		result.push(dep);
	}, [], this);

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
	var _this = this;
	return _.filter(files, minimatch.filter(this.types[type], { matchBase: true }));
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
