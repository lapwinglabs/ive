/**
 * Module Dependencies
 */

var validate = require('./validate');

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
 * @param {Ive} ive
 */

function form(el, ive) {
  if (el.nodeName != 'FORM') throw new Error('ive(el) expects a <form> element');

  // browser-only modules
  var event = require('event');

  // bind onto the form
  var submit = el.querySelector('input[type="submit"]');
  event.bind(el, 'submit', onsubmit(el, submit, ive));

  var inputs = el.querySelectorAll('input, textarea');
  for (var i = 0, input; input = inputs[i]; i++) {
    if (exclude.test(input.type)) continue;
    event.bind(input, 'blur', onblur(input, ive));
  }
}

/**
 * Listen to submit events
 */

function onsubmit(form, button, ive) {
  var Form = require('form');

  return function submit(e) {
    if (form.getAttribute('submitting')) {
      form.removeAttribute('submitting');
      return true;
    }

    e.preventDefault();
    e.stopImmediatePropagation();

    var json = Form(form).serialize();
    ive.emit('submitting', form, json);
    form.setAttribute('submitting', 'submitting');

    ive(json, function(err, v) {
      setAttr(form, err);
      ive.emit('submit', form, err, v);

      if (err) {
        for (var n in err.fields) setAttr(form.querySelector('[name="' + n + '"]'), err.fields[n])
        form.removeAttribute('submitting');
      } else {
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

function onblur(input, ive) {
  var name = input.getAttribute('name');
  return function event(e) {
    var value = input.value;
    if ('' === value) return;
    ive.attrs[name](value, function(err, v) {
      ive.emit('blur', input, err, v);
      setAttr(input, err);
    });
  };
}

/**
 * Set the element's attributes
 *
 * @param {Element} el
 * @param {Error} err
 * @return {Function}
 */

function setAttr(el, err) {
  if (err) {
    el.setAttribute('invalid', err.message);
    el.removeAttribute('valid');
  } else {
    el.removeAttribute('invalid');
    el.setAttribute('valid', 'valid');
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

