'use strict';

/**
 * isDir(str)
 * Crude name checking to see if file destination it's actually a directory
 *
 * @public
 * @param {String} file/directory name
 */
module.exports = {
	isDir: function (str) {
		return str.slice(-1) === '/' || str.indexOf('.') < 0;
	}
}
