/**
 * Module Dependencies
 */

var validate = require('./validate');
var only = require('./only');
var slice = [].slice;

/**
 * Export `form`
 */

module.exports = form;

/**
 * Exclude
 */

var exclude = /^(button|submit|reset|hidden)$/i;
var nodenames = /^(INPUT|TEXTAREA)$/;

/**
 * Initialize `form`
 *
 * @param {HTMLForm} form
 * @param {Ive} ive
 */

function form(form, fn, schema) {
  if (form.nodeName != 'FORM') throw new Error('ive(form) expects a <form> element');

  var fields = slice.call(form.querySelectorAll('[validate]'));
  var submit = form.querySelector('input[type="submit"]');
  var value = require('value');
  var event = require('event');
  var Form = require('form');

  // "submit": validate all fields
  event.bind(form, 'submit', function(e) {
    var names = fieldnames(fields);
    var enable = disable(submit);

    e.stopImmediatePropagation();
    e.preventDefault();

    form.setAttribute('submitting', 'submitting');

    var json = Form(form).serialize();

    // validate
    validate(json, only(schema, names), function(err, obj) {
      if (err) {
        form.removeAttribute('submitting');
        fields.forEach(function(field) {
          var input = fetch(field);
          if (!input) return;
          var name = input.name;
          var e = err.fields[name];
          if (e) setAttr(field, e);
        });

        fn && fn(err);
        enable();
      } else {
        fn ? fn(null, obj) : form.submit();
      }
    });
  });

  // "blur" or "change": validate field
  fields.forEach(function(field) {
    var input = fetch(field);
    if (!input) return;
    var name = input.name;

    event.bind(input, 'change', check);
    event.bind(input, 'blur', check);

    function check(e) {
      var val = value(input);
      if ('' === val || input.disabled) return;
      schema[name](val, function(err, v) {
        setAttr(field, err, v);
      });
    }
  });
}

/**
 * Only validate on these fields
 *
 * @param {NodeList} fields
 * @return {String}
 */

function fieldnames(fields) {
  var names = [];
  for (var i = 0, field; field = fields[i]; i++) {
    var input = fetch(field);
    if (!input || !input.name || input.disabled) continue;
    names.push(input.name);
  }

  return names.join(' ');
}

/**
 * Get the inputs from the fields
 *
 * @param {NodeList} fields
 * @return {Boolean|InputElement}
 */

function fetch(field) {
  var input = nodenames.test(field.nodeName) ? field : field.querySelector('input,textarea');
  if (exclude.test(input.type)) return false;
  return input;
}

/**
 * Set the element's attributes
 *
 * @param {Element} el
 * @param {Error} err
 * @param {Mixed} val
 * @return {Function}
 */

function setAttr(el, err, val) {
  if (err) {
    el.setAttribute('invalid', err.message);
    el.removeAttribute('valid');
  } else {
    el.removeAttribute('invalid');
    if (val) el.setAttribute('valid', val);
  }
}

/**
 * Disable submit button
 *
 * @param {Element} btn
 * @return {Function}
 */

function disable(btn) {
  if (btn) btn.disabled = true;
  return function() {
    if (btn) btn.disabled = false;
  }
}
