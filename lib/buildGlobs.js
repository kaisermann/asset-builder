'use strict';

var _ = require('lodash');
var obj = require('object-path');
var minimatch = require('minimatch');
var Dependency = require('./Dependency');
var traverse = require('traverse');
var path = require('path');

/**
 * buildGlobs
 *
 * @class
 * @param {Object} dependencies a map of dependencies
 * @param {Array} bowerFiles an array bower component file paths
 * @param {Object} options
 *
 * @property {Object} globs the glob strings organized by type
 * @property {Object} globs.js an array of javascript Dependency objects
 * @property {Object} globs.css an array of css Dependency objects
 * @property {Object} globs.fonts an array of fonts path glob strings
 * @property {Object} globs.images an array of image path glob strings
 * @property {Object} globs.bower an array of bower component glob strings
 */
var buildGlobs = module.exports = function (types, dependencies, bowerFiles, options) {
	options = options || {};
	this.types = types;

	this.globs = {};
	_.forOwn(this.types, function (typeGlob, typeName) {
		this.globs[typeName] = this.getOutputFiles(typeName, typeGlob, dependencies, bowerFiles)
	}, this);

	this.globs.bower = bowerFiles;
};

/**
 * getOutputFiles
 *
 * @param {String} type
 * @param {Object} dependencies
 * @param {Array} bowerFiles an array bower component file paths
 * @return {undefined}
 */
buildGlobs.prototype.getOutputFiles = function (typeName, typeGlob, dependencies, bowerFiles) {
	var outputFiles;

	if (!this.types)
		throw 'BuildGlob must be instantiated.';

	outputFiles = _.pick(dependencies[typeName], function (dependency, name) {
		return name === '*' || minimatch(name, typeGlob);
	});

	outputFiles = _.transform(outputFiles, function (result, dependency, name) {
		// convert to an array of dependencyObjects
		var dep = new Dependency(name, dependency, typeName);
		var bower = [];
		var bowerExclude = this.bowerExclude(dependencies[typeName]);

		if (dependency.bower) {
			bower = bower.concat(
				this.filterByType(
					this.filterByPackage(bowerFiles, dependency.bower),
					typeName
				)
			);
		} else {
			if (dependency.main) {
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

	if (outputFiles.length == 1 && outputFiles[0].name == '*')
		outputFiles = outputFiles[0];

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

buildGlobs.prototype.bowerExclude = function (dependencies) {
	// resolve bower dependencies
	return traverse(dependencies).reduce(function (result) {
		var parentKey = obj.get(this, 'parent.key');
		if (this.isLeaf && parentKey === 'bower') {
			result.push(this.parent.node);
		}
		return _.flatten(result);
	}, []);
};
