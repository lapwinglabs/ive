/**
 * Module Dependencies
 */

var validate = require('./lib/validate');
var extend = require('extend.js');
var form = require('./lib/form');
var only = require('./lib/only');
var isArray = Array.isArray;
var Rube = require('rube');

/**
 * Export `Ive`
 */

module.exports = Ive;

/**
 * Validate an object against a schema
 *
 * @return {Function}
 * @api public
 */

function Ive(props) {
  if (!(this instanceof Ive)) return new Ive(props);

  /**
   * Create a ive instance
   *
   * @param  {Object|String|FormElement|Array|NodeList}
   * @param  {Function} fn
   * @return {Ive} self
   */

  function ive(filter, obj, fn) {
    if ('object' == typeof filter) fn = obj, obj = filter, filter = false;
    var attrs = filter ? only(ive.attrs, filter) : ive.attrs;

    // Browser element
    if (obj.nodeName) {
      form(obj, fn, attrs);
    } else if (isArray(obj) || isNodeList(obj)) {
      for (var i = 0, el; el = obj[i]; i++) form(el, fn, attrs);
    } else if (fn) {
      // validate
      validate(obj, attrs, fn);
    } else {
      // thunkify
      return function (done) {
        validate(obj, attrs, done);
      }
    }

    return ive;
  }

  ive.attrs = {};

  // add the methods
  for (var k in Ive.prototype) {
    ive[k] = Ive.prototype[k];
  }

  // add the attributes
  ive.attr(props);

  return ive;
}

/**
 * Add an attribute
 *
 * @param {String} attr
 * @param {Rube} rube (optional)
 */

Ive.prototype.attr = function(key, rube) {
  if (!key) {
    return this.attrs;
  } else if ('ive' == key.name || 'object' == typeof key) {
    this.attrs = extend(this.attrs, key.attrs || key)
    return this;
  } else if (rube) {
    if (!this.attrs[key]) this.attrs[key] = Rube();
    this.attrs[key].use(rube);
    return this;
  } else {
    return this.attrs[key] || (this.attrs[key] = Rube());
  }
};

/**
 * Filter out fields
 *
 * @param {String|Array} fields
 * @param {Object} attrs
 * @return {Function}
 */

function filter(fields, attrs) {
  return function(obj, fn) {
    return validate(obj, only(attrs, fields), fn);
  }
}

/**
 * Check if the element is a nodelist
 *
 * @param {Mixed} el
 * @return {Boolean}
 */

function isNodeList(el) {
  return typeof el.length == 'number'
      && typeof el.item == 'function'
      && typeof el.nextNode == 'function'
      && typeof el.reset == 'function'
    ? true
    : false;
}
