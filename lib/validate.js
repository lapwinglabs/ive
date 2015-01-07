/**
 * Module Dependencies
 */

var Batch = require('batch');
var keys = Object.keys;

/**
 * Export `validate`
 */

module.exports = validate;

/**
 * Validate
 *
 * @param {Object} obj
 * @param {Object} schema
 * @return {Function} fn
 */

function validate(obj, schema, fn) {
  var batch = Batch().throws(false);
  var attrs = keys(schema);
  var errors = {};
  var values = {};

  // loop through each of the schema attributes
  attrs.forEach(function(attr) {
    batch.push(function (next) {
      schema[attr](obj[attr], function(err, v) {
        if (err) {
          errors[attr] = err;
          return next(err);
        } else {
          values[attr] = v;
          return next();
        }
      });
    });
  });

  batch.end(function() {
    return keys(errors).length
      ? fn(format(errors, obj))
      : fn(null, values);
  })
};

/**
 * Format the errors into a single error
 *
 * TODO: create a custom error
 *
 * @param {Array} arr
 * @return {Error}
 */

function format(errors, actual) {
  // format the object
  actual = JSON.stringify(actual, true, 2).split('\n').map(function(line) {
    return '     |  ' + line;
  }).join('\n');

  // format the errors
  var msg = keys(errors).map(function(error, i) {
    return '     |  ' + (i + 1) + '. ' + error + ': ' + errors[error].message;
  }).join('\n');

  var err = new Error('\n     |\n     |  Rube Schema Validation Error\n     |\n' + actual + '\n     |\n' + msg + '\n     |\n');
  err.fields = errors;
  return err;
}
