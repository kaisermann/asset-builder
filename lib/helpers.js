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
  },
  objFilter: function (obj, predicate) {
    return Object.keys(obj).filter(function (key) {
        return predicate(obj[key], key);
      })
      .reduce(function (res, key) {
        return (res[key] = obj[key], res);
      }, {});
  }
}
