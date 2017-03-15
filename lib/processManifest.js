'use strict';

var _ = require('lodash');
var traverse = require('traverse');
var obj = require('object-path');
var path = require('path');

/**
 * processManifest
 *
 * @param {Object} json
 * @return {Object}
 */
module.exports = function (json) {
  var defaults = {
    config: {
      paths: {
        source: 'assets/',
        dist: 'dist/',
        bowerDirectory: 'bower_components',
        bowerJson: 'bower.json'
      }
    }
  };
  var err = function (msg) {
    msg = msg || 'file seems to be malformed';
    throw new Error('Manifest File Error: ' + msg);
  };
  var required = ['resources'];

  if (_.isPlainObject(json)) {
    json = _.merge(defaults, json);

    // check to see if the JSON data has the minimum needed properties
    _.forEach(required, function (req) {
      if (!obj.has(json, req)) {
        err('missing "' + req + '" property');
      }
    });

    // users can specify files as either
    // * an array of file paths
    // * a string with a single file path
    // this function converts all strings to arrays
    _.forEach(json.resources, function (type, typeName) {
      traverse(type.assets).forEach(function (node) {
        if (this.isLeaf && !_.isArray(node) && !_.isBoolean(node) && !_.isArray(this.parent.node)) {
          this.update([node.trim()]);
        }
      });
    });

    // users can specify their file paths as
    // * "path/to/file.js"
    // and it will be processed into
    // * "assets/path/to/file.js"
    // users can set the "external" property to true to not append the dir
    _.forOwn(json.resources, function (typeInfo, typeName) {
      _.forOwn(typeInfo.assets, function (asset, outputName) {
        if (!asset.external) {
          if (Array.isArray(asset) && asset.length === 1) {
            asset = {
              files: asset
            };
          }
          asset.files = _.map(asset.files, function (file) {
            var resultPath = '';
            if (file.indexOf('!') === 0) {
              file = file.substr(1);
              resultPath += '!';
            }
            resultPath += path.join(json.config.paths.source, file);
            return resultPath;
          });
        }
        asset.type = typeName;
        json.resources[typeName].assets[outputName] = asset;
        return asset;
      });
    });
    return json;
  } else {
    err();
  }
};
