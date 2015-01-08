/**
 * Module Dependencies
 */

var validate = require('./validate');
var assert = require('assert');

/**
 * Export `form`
 */

module.exports = form;

/**
 * Exclude
 */

var exclude = /^(button|submit|reset|hidden)$/;

/**
 * Initialize `form`
 *
 * @param {HTMLForm} el
 */

function form(el, schema) {
  assert(el.nodeName == 'FORM');

  // browser-only modules
  var event = require('event');

  // bind onto the form
  var submit = el.querySelector('input[type="submit"]');
  event.bind(el, 'submit', onsubmit(el, submit, schema));

  var inputs = el.querySelectorAll('input, textarea');
  for (var i = 0, input; input = inputs[i]; i++) {
    if (exclude.test(input.type)) continue;
    event.bind(input, 'blur', onevent(input, schema.attrs, field));
  }
}

/**
 * Listen to submit events
 */

function onsubmit(form, button, schema) {
  var Form = require('form');

  return function submit(e) {
    if (form.getAttribute('submitting')) return true;

    e.preventDefault();
    e.stopImmediatePropagation();

    var json = Form(form).serialize();
    schema(json, function(err, v) {
      if (err) {
        form.setAttribute('invalid', err.message);
        for (var name in err.fields) {
          field(form.querySelector('[name="' + name + '"]'))(err.fields[name]);
        }
      } else {
        form.setAttribute('submitting', 'submitting');
        form.removeAttribute('invalid');
        submitForm(form);
      }
    });
  };
}

/**
 * Listen for blur events
 *
 * @param {InputElement} inputs
 * @param {Object} attrs
 * @param {Function} fn
 * @return {Function}
 */

function onevent(input, attrs, fn) {
  var name = input.getAttribute('name');
  return function event(e) {
    var value = input.value;
    if ('' === value) return;
    attrs[name](value, fn(input));
  };
}

/**
 * Check validation on a field
 *
 * @param {InputElement} input
 * @return {Function}
 */

function field(input) {
  return function check(err, v) {
    if (err) {
      input.setAttribute('invalid', err.message);
    } else {
      input.removeAttribute('invalid');
      if (v) input.value = v;
    }
  }
}

/**
 * Submit a `form` programmatically,
 * triggering submit handlers.
 *
 * @param {Element} form
 */

function submitForm(form) {
  var trigger = require('trigger-event');
  var button = document.createElement('button');
  button.style.display = 'none';
  form.appendChild(button);
  trigger(button, 'click', { clientX: 0, clientY: 0});
  form.removeChild(button);
}

