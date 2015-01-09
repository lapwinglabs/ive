/**
 * Module Dependencies
 */

module.exports = only;

/**
 * Filter `obj` by `keys`
 *
 * @param {Object} obj
 * @return {Object}
 */

function only(obj, keys){
  obj = obj || {};
  if ('string' == typeof keys) keys = keys.split(/ +/);
  return keys.reduce(function(ret, key){
    if (null == obj[key]) return ret;
    ret[key] = obj[key];
    return ret;
  }, {});
};
