'use strict';

var _ = require('lodash');
var traverse = require('traverse');
var obj = require('object-path');

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
				source: "assets/",
				dist: "dist/",
				bowerDirectory: "bower_components",
				bowerJson: "bower.json"
			}
		}
	};
	var err = function (msg) {
		msg = msg || 'file seems to be malformed';
		throw new Error('Manifest File Error: ' + msg);
	};
	var required = ['config.fileTypes', 'assets'];

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
		traverse(json.assets).forEach(function (node) {
			if (this.isLeaf && !_.isArray(node) && !_.isArray(this.parent.node)) {
				this.update([node]);
			}
		});


		// users can specify their file paths as
		// * "path/to/file.js"
		// and it will be processed into
		// * "assets/path/to/file.js"
		// users can set the "external" property to true to not append the dir
		_.forOwn(json.assets, function (deps, depType) {
			_.forOwn(deps, function (dependency, depName) {
				if (!dependency.external) {
					json.assets[depType][depName].files = _.map(dependency.files, function (file) {
						return json.config.paths.source + file;
					});
				}
				return dependency;
			});
		});
		return json;
	} else {
		err();
	}
};
