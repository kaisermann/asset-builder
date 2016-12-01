'use strict';

var _ = require('lodash');
var obj = require('object-path');
var minimatch = require('minimatch');
var Asset = require('./Asset');
var traverse = require('traverse');
var path = require('path');
var helpers = require('./helpers');

var tmpOptions;

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
var buildGlobs = module.exports = function (resources, pkgs, options) {
  var _this = this;
  tmpOptions = options || {};

  this.resources = resources;

  this.globs = {};

  _.forOwn(this.resources, function (resourceInfo, resourceType) {
    _this.globs[resourceType] = _this.getOutputFiles(resourceType, resourceInfo, pkgs);
  }, this);

  ['bower', 'npm'].forEach(function (node) {
    _this.globs[node] = pkgs[node];
  });
};

/**
 * getOutputFiles
 *
 * @param {String} resourceType
 * @param {Object} resourceInfo
 * @param {Array} bowerFiles an array bower component file paths
 * @return {undefined}
 */
buildGlobs.prototype.getOutputFiles = function (resourceType, resourceInfo, pkgs) {
  var outputFiles,
    _this = this;

  if (!this.resources) {
    throw 'BuildGlob must be instantiated.';
  }

  outputFiles = helpers.objFilter(resourceInfo.assets, function (asset, name) {
    return helpers.isDir(name) || minimatch(name, resourceInfo.pattern, {
      matchBase: true
    });
  });

  outputFiles = _.transform(outputFiles, function (result, asset, name) {
    // convert to an array of assetObjects
    var dep = new Asset(name, asset);
    var toInclude = [];

    ['bower', 'npm'].forEach(function (manager) {
      var pckgExclude = _this.pckgExclude(manager, resourceInfo.assets);
      if (asset[manager]) {
        toInclude = toInclude.concat(
          _this.filterByType(
            _this.filterByPackage(manager, pkgs[manager], asset[manager]),
            resourceType
          )
        );
      } else {
        if (asset.main) {
          toInclude = toInclude.concat(
            _this.filterByType(
              _this.rejectByPackage(manager, pkgs[manager], pckgExclude),
              resourceType
            )
          );
        }
      }
    });
    dep.prependGlobs(toInclude);
    result.push(dep);
  }, []);

  return outputFiles;
};

buildGlobs.prototype.getPackageManagerDir = function (pckgManager) {
  switch (pckgManager) {
  case 'bower':
    return 'bower_components';
  case 'npm':
    return 'node_modules';
  }
  return;
};

/**
 * filterByPackage
 *
 * @param {Array} files
 * @param {String|Array} names
 * @return {Array} files for a particular package name
 */
buildGlobs.prototype.filterByPackage = function (pckgManager, files, names, reject) {
  var method = reject ? 'reject' : 'filter';
  if (!_.isArray(names)) {
    names = [names];
  }
  return _[method](files, function (file) {
    return _.some(names, function (name) {
      return file.indexOf(
        path.normalize(path.join(buildGlobs.prototype.getPackageManagerDir(pckgManager), name))
      ) > -1;
    });
  });
};

buildGlobs.prototype.rejectByPackage = function (manager, files, names) {
  return buildGlobs.prototype.filterByPackage(manager, files, names, true);
};

/**
 * filterByType
 *
 * @param {Array} files
 * @param {String} type
 * @return {Array} files for a particular type
 */
buildGlobs.prototype.filterByType = function (files, type) {
  return _.filter(files, minimatch.filter(this.resources[type].pattern, {
    matchBase: true
  }));
};

buildGlobs.prototype.pckgExclude = function (manager, assets) {
  return traverse(assets).reduce(function (result) {
    if (this.isLeaf) {
      var parentKey = obj.get(this, 'parent.key');
      if (parentKey === manager) {
        result.push(this.parent.node);
      }
    }
    return _.flatten(result);
  }, []);
};
