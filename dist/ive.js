(function outer(modules, cache, entries){

  /**
   * Global
   */

  var global = (function(){ return this; })();

  /**
   * Require `name`.
   *
   * @param {String} name
   * @param {Boolean} jumped
   * @api public
   */

  function require(name, jumped){
    if (cache[name]) return cache[name].exports;
    if (modules[name]) return call(name, require);
    throw new Error('cannot find module "' + name + '"');
  }

  /**
   * Call module `id` and cache it.
   *
   * @param {Number} id
   * @param {Function} require
   * @return {Function}
   * @api private
   */

  function call(id, require){
    var m = cache[id] = { exports: {} };
    var mod = modules[id];
    var name = mod[2];
    var fn = mod[0];

    fn.call(m.exports, function(req){
      var dep = modules[id][1][req];
      return require(dep ? dep : req);
    }, m, m.exports, outer, modules, cache, entries);

    // expose as `name`.
    if (name) cache[name] = cache[id];

    return cache[id].exports;
  }

  /**
   * Require all entries exposing them on global if needed.
   */

  for (var id in entries) {
    if (entries[id]) {
      global[entries[id]] = require(id);
    } else {
      require(id);
    }
  }

  /**
   * Duo flag.
   */

  require.duo = true;

  /**
   * Expose cache.
   */

  require.cache = cache;

  /**
   * Expose modules
   */

  require.modules = modules;

  /**
   * Return newest require.
   */

   return require;
})({
1: [function(require, module, exports) {
/**
 * Module Dependencies
 */

var validate = require('./lib/validate');
var extend = require('extend.js');
var form = require('./lib/form');
var Batch = require('batch');
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

  function ive(obj, fn) {
    if ('string' == typeof obj) return filter(obj, ive.attrs);

    // Browser element
    if (obj.nodeName) {
      form(obj, ive);
    } else if (isArray(obj) || isNodeList(obj)) {
      for (var i = 0, el; el = obj[i]; i++) form(el, ive);
    } else if (fn) {
      // validate
      validate(obj, ive.attrs, fn);
    } else {
      // thunkify
      return function (done) {
        validate(obj, ive.attrs, done);
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

}, {"./lib/validate":2,"extend.js":3,"./lib/form":4,"batch":5,"rube":6}],
2: [function(require, module, exports) {
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

}, {"batch":5}],
5: [function(require, module, exports) {
/**
 * Module dependencies.
 */

try {
  var EventEmitter = require('events').EventEmitter;
} catch (err) {
  var Emitter = require('emitter');
}

/**
 * Noop.
 */

function noop(){}

/**
 * Expose `Batch`.
 */

module.exports = Batch;

/**
 * Create a new Batch.
 */

function Batch() {
  if (!(this instanceof Batch)) return new Batch;
  this.fns = [];
  this.concurrency(Infinity);
  this.throws(true);
  for (var i = 0, len = arguments.length; i < len; ++i) {
    this.push(arguments[i]);
  }
}

/**
 * Inherit from `EventEmitter.prototype`.
 */

if (EventEmitter) {
  Batch.prototype.__proto__ = EventEmitter.prototype;
} else {
  Emitter(Batch.prototype);
}

/**
 * Set concurrency to `n`.
 *
 * @param {Number} n
 * @return {Batch}
 * @api public
 */

Batch.prototype.concurrency = function(n){
  this.n = n;
  return this;
};

/**
 * Queue a function.
 *
 * @param {Function} fn
 * @return {Batch}
 * @api public
 */

Batch.prototype.push = function(fn){
  this.fns.push(fn);
  return this;
};

/**
 * Set wether Batch will or will not throw up.
 *
 * @param  {Boolean} throws
 * @return {Batch}
 * @api public
 */
Batch.prototype.throws = function(throws) {
  this.e = !!throws;
  return this;
};

/**
 * Execute all queued functions in parallel,
 * executing `cb(err, results)`.
 *
 * @param {Function} cb
 * @return {Batch}
 * @api public
 */

Batch.prototype.end = function(cb){
  var self = this
    , total = this.fns.length
    , pending = total
    , results = []
    , errors = []
    , cb = cb || noop
    , fns = this.fns
    , max = this.n
    , throws = this.e
    , index = 0
    , done;

  // empty
  if (!fns.length) return cb(null, results);

  // process
  function next() {
    var i = index++;
    var fn = fns[i];
    if (!fn) return;
    var start = new Date;

    try {
      fn(callback);
    } catch (err) {
      callback(err);
    }

    function callback(err, res){
      if (done) return;
      if (err && throws) return done = true, cb(err);
      var complete = total - pending + 1;
      var end = new Date;

      results[i] = res;
      errors[i] = err;

      self.emit('progress', {
        index: i,
        value: res,
        error: err,
        pending: pending,
        total: total,
        complete: complete,
        percent: complete / total * 100 | 0,
        start: start,
        end: end,
        duration: end - start
      });

      if (--pending) next();
      else if(!throws) cb(errors, results);
      else cb(null, results);
    }
  }

  // concurrency
  for (var i = 0; i < fns.length; i++) {
    if (i == max) break;
    next();
  }

  return this;
};

}, {"emitter":7}],
7: [function(require, module, exports) {

/**
 * Expose `Emitter`.
 */

module.exports = Emitter;

/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */

function Emitter(obj) {
  if (obj) return mixin(obj);
};

/**
 * Mixin the emitter properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }
  return obj;
}

/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.on =
Emitter.prototype.addEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};
  (this._callbacks[event] = this._callbacks[event] || [])
    .push(fn);
  return this;
};

/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.once = function(event, fn){
  var self = this;
  this._callbacks = this._callbacks || {};

  function on() {
    self.off(event, on);
    fn.apply(this, arguments);
  }

  on.fn = fn;
  this.on(event, on);
  return this;
};

/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.off =
Emitter.prototype.removeListener =
Emitter.prototype.removeAllListeners =
Emitter.prototype.removeEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};

  // all
  if (0 == arguments.length) {
    this._callbacks = {};
    return this;
  }

  // specific event
  var callbacks = this._callbacks[event];
  if (!callbacks) return this;

  // remove all handlers
  if (1 == arguments.length) {
    delete this._callbacks[event];
    return this;
  }

  // remove specific handler
  var cb;
  for (var i = 0; i < callbacks.length; i++) {
    cb = callbacks[i];
    if (cb === fn || cb.fn === fn) {
      callbacks.splice(i, 1);
      break;
    }
  }
  return this;
};

/**
 * Emit `event` with the given args.
 *
 * @param {String} event
 * @param {Mixed} ...
 * @return {Emitter}
 */

Emitter.prototype.emit = function(event){
  this._callbacks = this._callbacks || {};
  var args = [].slice.call(arguments, 1)
    , callbacks = this._callbacks[event];

  if (callbacks) {
    callbacks = callbacks.slice(0);
    for (var i = 0, len = callbacks.length; i < len; ++i) {
      callbacks[i].apply(this, args);
    }
  }

  return this;
};

/**
 * Return array of callbacks for `event`.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */

Emitter.prototype.listeners = function(event){
  this._callbacks = this._callbacks || {};
  return this._callbacks[event] || [];
};

/**
 * Check if this emitter has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */

Emitter.prototype.hasListeners = function(event){
  return !! this.listeners(event).length;
};

}, {}],
3: [function(require, module, exports) {
/**
 * Extend an object with another.
 *
 * @param {Object, ...} src, ...
 * @return {Object} merged
 * @api private
 */

module.exports = function(src) {
  var objs = [].slice.call(arguments, 1), obj;

  for (var i = 0, len = objs.length; i < len; i++) {
    obj = objs[i];
    for (var prop in obj) {
      src[prop] = obj[prop];
    }
  }

  return src;
}

}, {}],
4: [function(require, module, exports) {
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
    if (exclude.test(input.type)) return;
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


}, {"./validate":2,"assert":8,"event":9,"form":10,"trigger-event":11}],
8: [function(require, module, exports) {

/**
 * Module dependencies.
 */

var equals = require('equals');
var fmt = require('fmt');
var stack = require('stack');

/**
 * Assert `expr` with optional failure `msg`.
 *
 * @param {Mixed} expr
 * @param {String} [msg]
 * @api public
 */

module.exports = exports = function (expr, msg) {
  if (expr) return;
  throw error(msg || message());
};

/**
 * Assert `actual` is weak equal to `expected`.
 *
 * @param {Mixed} actual
 * @param {Mixed} expected
 * @param {String} [msg]
 * @api public
 */

exports.equal = function (actual, expected, msg) {
  if (actual == expected) return;
  throw error(msg || fmt('Expected %o to equal %o.', actual, expected), actual, expected);
};

/**
 * Assert `actual` is not weak equal to `expected`.
 *
 * @param {Mixed} actual
 * @param {Mixed} expected
 * @param {String} [msg]
 * @api public
 */

exports.notEqual = function (actual, expected, msg) {
  if (actual != expected) return;
  throw error(msg || fmt('Expected %o not to equal %o.', actual, expected));
};

/**
 * Assert `actual` is deep equal to `expected`.
 *
 * @param {Mixed} actual
 * @param {Mixed} expected
 * @param {String} [msg]
 * @api public
 */

exports.deepEqual = function (actual, expected, msg) {
  if (equals(actual, expected)) return;
  throw error(msg || fmt('Expected %o to deeply equal %o.', actual, expected), actual, expected);
};

/**
 * Assert `actual` is not deep equal to `expected`.
 *
 * @param {Mixed} actual
 * @param {Mixed} expected
 * @param {String} [msg]
 * @api public
 */

exports.notDeepEqual = function (actual, expected, msg) {
  if (!equals(actual, expected)) return;
  throw error(msg || fmt('Expected %o not to deeply equal %o.', actual, expected));
};

/**
 * Assert `actual` is strict equal to `expected`.
 *
 * @param {Mixed} actual
 * @param {Mixed} expected
 * @param {String} [msg]
 * @api public
 */

exports.strictEqual = function (actual, expected, msg) {
  if (actual === expected) return;
  throw error(msg || fmt('Expected %o to strictly equal %o.', actual, expected), actual, expected);
};

/**
 * Assert `actual` is not strict equal to `expected`.
 *
 * @param {Mixed} actual
 * @param {Mixed} expected
 * @param {String} [msg]
 * @api public
 */

exports.notStrictEqual = function (actual, expected, msg) {
  if (actual !== expected) return;
  throw error(msg || fmt('Expected %o not to strictly equal %o.', actual, expected));
};

/**
 * Assert `block` throws an `error`.
 *
 * @param {Function} block
 * @param {Function} [error]
 * @param {String} [msg]
 * @api public
 */

exports.throws = function (block, err, msg) {
  var threw;
  try {
    block();
  } catch (e) {
    threw = e;
  }

  if (!threw) throw error(msg || fmt('Expected %s to throw an error.', block.toString()));
  if (err && !(threw instanceof err)) {
    throw error(msg || fmt('Expected %s to throw an %o.', block.toString(), err));
  }
};

/**
 * Assert `block` doesn't throw an `error`.
 *
 * @param {Function} block
 * @param {Function} [error]
 * @param {String} [msg]
 * @api public
 */

exports.doesNotThrow = function (block, err, msg) {
  var threw;
  try {
    block();
  } catch (e) {
    threw = e;
  }

  if (threw) throw error(msg || fmt('Expected %s not to throw an error.', block.toString()));
  if (err && (threw instanceof err)) {
    throw error(msg || fmt('Expected %s not to throw an %o.', block.toString(), err));
  }
};

/**
 * Create a message from the call stack.
 *
 * @return {String}
 * @api private
 */

function message() {
  if (!Error.captureStackTrace) return 'assertion failed';
  var callsite = stack()[2];
  var fn = callsite.getFunctionName();
  var file = callsite.getFileName();
  var line = callsite.getLineNumber() - 1;
  var col = callsite.getColumnNumber() - 1;
  var src = get(file);
  line = src.split('\n')[line].slice(col);
  var m = line.match(/assert\((.*)\)/);
  return m && m[1].trim();
}

/**
 * Load contents of `script`.
 *
 * @param {String} script
 * @return {String}
 * @api private
 */

function get(script) {
  var xhr = new XMLHttpRequest;
  xhr.open('GET', script, false);
  xhr.send(null);
  return xhr.responseText;
}

/**
 * Error with `msg`, `actual` and `expected`.
 *
 * @param {String} msg
 * @param {Mixed} actual
 * @param {Mixed} expected
 * @return {Error}
 */

function error(msg, actual, expected){
  var err = new Error(msg);
  err.showDiff = 3 == arguments.length;
  err.actual = actual;
  err.expected = expected;
  return err;
}

}, {"equals":12,"fmt":13,"stack":14}],
12: [function(require, module, exports) {
var type = require('type')

// (any, any, [array]) -> boolean
function equal(a, b, memos){
  // All identical values are equivalent
  if (a === b) return true
  var fnA = types[type(a)]
  var fnB = types[type(b)]
  return fnA && fnA === fnB
    ? fnA(a, b, memos)
    : false
}

var types = {}

// (Number) -> boolean
types.number = function(a, b){
  return a !== a && b !== b/*Nan check*/
}

// (function, function, array) -> boolean
types['function'] = function(a, b, memos){
  return a.toString() === b.toString()
    // Functions can act as objects
    && types.object(a, b, memos)
    && equal(a.prototype, b.prototype)
}

// (date, date) -> boolean
types.date = function(a, b){
  return +a === +b
}

// (regexp, regexp) -> boolean
types.regexp = function(a, b){
  return a.toString() === b.toString()
}

// (DOMElement, DOMElement) -> boolean
types.element = function(a, b){
  return a.outerHTML === b.outerHTML
}

// (textnode, textnode) -> boolean
types.textnode = function(a, b){
  return a.textContent === b.textContent
}

// decorate `fn` to prevent it re-checking objects
// (function) -> function
function memoGaurd(fn){
  return function(a, b, memos){
    if (!memos) return fn(a, b, [])
    var i = memos.length, memo
    while (memo = memos[--i]) {
      if (memo[0] === a && memo[1] === b) return true
    }
    return fn(a, b, memos)
  }
}

types['arguments'] =
types.array = memoGaurd(arrayEqual)

// (array, array, array) -> boolean
function arrayEqual(a, b, memos){
  var i = a.length
  if (i !== b.length) return false
  memos.push([a, b])
  while (i--) {
    if (!equal(a[i], b[i], memos)) return false
  }
  return true
}

types.object = memoGaurd(objectEqual)

// (object, object, array) -> boolean
function objectEqual(a, b, memos) {
  if (typeof a.equal == 'function') {
    memos.push([a, b])
    return a.equal(b, memos)
  }
  var ka = getEnumerableProperties(a)
  var kb = getEnumerableProperties(b)
  var i = ka.length

  // same number of properties
  if (i !== kb.length) return false

  // although not necessarily the same order
  ka.sort()
  kb.sort()

  // cheap key test
  while (i--) if (ka[i] !== kb[i]) return false

  // remember
  memos.push([a, b])

  // iterate again this time doing a thorough check
  i = ka.length
  while (i--) {
    var key = ka[i]
    if (!equal(a[key], b[key], memos)) return false
  }

  return true
}

// (object) -> array
function getEnumerableProperties (object) {
  var result = []
  for (var k in object) if (k !== 'constructor') {
    result.push(k)
  }
  return result
}

module.exports = equal

}, {"type":15}],
15: [function(require, module, exports) {

var toString = {}.toString
var DomNode = typeof window != 'undefined'
  ? window.Node
  : Function

/**
 * Return the type of `val`.
 *
 * @param {Mixed} val
 * @return {String}
 * @api public
 */

module.exports = exports = function(x){
  var type = typeof x
  if (type != 'object') return type
  type = types[toString.call(x)]
  if (type) return type
  if (x instanceof DomNode) switch (x.nodeType) {
    case 1:  return 'element'
    case 3:  return 'text-node'
    case 9:  return 'document'
    case 11: return 'document-fragment'
    default: return 'dom-node'
  }
}

var types = exports.types = {
  '[object Function]': 'function',
  '[object Date]': 'date',
  '[object RegExp]': 'regexp',
  '[object Arguments]': 'arguments',
  '[object Array]': 'array',
  '[object String]': 'string',
  '[object Null]': 'null',
  '[object Undefined]': 'undefined',
  '[object Number]': 'number',
  '[object Boolean]': 'boolean',
  '[object Object]': 'object',
  '[object Text]': 'text-node',
  '[object Uint8Array]': 'bit-array',
  '[object Uint16Array]': 'bit-array',
  '[object Uint32Array]': 'bit-array',
  '[object Uint8ClampedArray]': 'bit-array',
  '[object Error]': 'error',
  '[object FormData]': 'form-data',
  '[object File]': 'file',
  '[object Blob]': 'blob'
}

}, {}],
13: [function(require, module, exports) {

/**
 * Export `fmt`
 */

module.exports = fmt;

/**
 * Formatters
 */

fmt.o = JSON.stringify;
fmt.s = String;
fmt.d = parseInt;

/**
 * Format the given `str`.
 *
 * @param {String} str
 * @param {...} args
 * @return {String}
 * @api public
 */

function fmt(str){
  var args = [].slice.call(arguments, 1);
  var j = 0;

  return str.replace(/%([a-z])/gi, function(_, f){
    return fmt[f]
      ? fmt[f](args[j++])
      : _ + f;
  });
}

}, {}],
14: [function(require, module, exports) {

/**
 * Expose `stack()`.
 */

module.exports = stack;

/**
 * Return the stack.
 *
 * @return {Array}
 * @api public
 */

function stack() {
  var orig = Error.prepareStackTrace;
  Error.prepareStackTrace = function(_, stack){ return stack; };
  var err = new Error;
  Error.captureStackTrace(err, arguments.callee);
  var stack = err.stack;
  Error.prepareStackTrace = orig;
  return stack;
}
}, {}],
9: [function(require, module, exports) {
var bind = window.addEventListener ? 'addEventListener' : 'attachEvent',
    unbind = window.removeEventListener ? 'removeEventListener' : 'detachEvent',
    prefix = bind !== 'addEventListener' ? 'on' : '';

/**
 * Bind `el` event `type` to `fn`.
 *
 * @param {Element} el
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @return {Function}
 * @api public
 */

exports.bind = function(el, type, fn, capture){
  el[bind](prefix + type, fn, capture || false);
  return fn;
};

/**
 * Unbind `el` event `type`'s callback `fn`.
 *
 * @param {Element} el
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @return {Function}
 * @api public
 */

exports.unbind = function(el, type, fn, capture){
  el[unbind](prefix + type, fn, capture || false);
  return fn;
};
}, {}],
10: [function(require, module, exports) {
// dependencies
var classes = require("classes");
var formElement = require("form-element");
var serialize = require("form-serialize");
var value = require("value");


// single export
module.exports = Form;


/**
 * A helper for working with HTML forms
 *
 * @constructor
 * @param {HTMLFormElement} el
 */
function Form(el) {
    if (!(this instanceof Form)) {
        return new Form(el);
    }

    this.element = el;
    this.classes = classes(this.element);
}


/**
 * Retrieves an input from the form by name. If 2 arguments are passed,
 * the first is assumed to be the name of a `<fieldset>`. (which allows
 * only retrieving from a specific subset of elements)
 *
 * @see http://github.com/dominicbarnes/form-element
 *
 * @param {String} [fieldset]  Only search for controls in the named fieldset
 * @param {String} name
 * @returns {HTMLElement}
 */
Form.prototype.input = function (fieldset, name) {
    if (!name) {
        name = fieldset;
        fieldset = null;
    }

    var el = fieldset ? formElement(this.element, fieldset) : this.element;
    return formElement(el, name);
};


/**
 * Gets/sets the value for a form input (found by name)
 *
 * @see https://github.com/component/value
 *
 * @param {String} name
 * @param {Mixed} val
 * @returns {Mixed}
 */
Form.prototype.value = function (name, val) {
    var args = [ this.input(name) ];
    if (typeof val !== "undefined") args.push(val);
    return value.apply(null, args);
};


/**
 * Serializes all the inputs of a form into a single JS object
 *
 * @see https://github.com/dominicbarnes/form-serialize
 *
 * @param {String} [fieldset]       Only serialize the controls in the named fieldset
 * @param {Function} [transformer]  Apply an interceptor function to the serializer
 * @returns {Object}
 */
Form.prototype.serialize = function (fieldset, transformer) {
    if (typeof fieldset === "function") {
        transformer = fieldset;
        fieldset = null;
    }

    var el = fieldset ? formElement(this.element, fieldset) : this.element;

    return serialize(el, transformer);
};

}, {"classes":16,"form-element":17,"form-serialize":18,"value":19}],
16: [function(require, module, exports) {
/**
 * Module dependencies.
 */

var index = require('indexof');

/**
 * Whitespace regexp.
 */

var re = /\s+/;

/**
 * toString reference.
 */

var toString = Object.prototype.toString;

/**
 * Wrap `el` in a `ClassList`.
 *
 * @param {Element} el
 * @return {ClassList}
 * @api public
 */

module.exports = function(el){
  return new ClassList(el);
};

/**
 * Initialize a new ClassList for `el`.
 *
 * @param {Element} el
 * @api private
 */

function ClassList(el) {
  if (!el || !el.nodeType) {
    throw new Error('A DOM element reference is required');
  }
  this.el = el;
  this.list = el.classList;
}

/**
 * Add class `name` if not already present.
 *
 * @param {String} name
 * @return {ClassList}
 * @api public
 */

ClassList.prototype.add = function(name){
  // classList
  if (this.list) {
    this.list.add(name);
    return this;
  }

  // fallback
  var arr = this.array();
  var i = index(arr, name);
  if (!~i) arr.push(name);
  this.el.className = arr.join(' ');
  return this;
};

/**
 * Remove class `name` when present, or
 * pass a regular expression to remove
 * any which match.
 *
 * @param {String|RegExp} name
 * @return {ClassList}
 * @api public
 */

ClassList.prototype.remove = function(name){
  if ('[object RegExp]' == toString.call(name)) {
    return this.removeMatching(name);
  }

  // classList
  if (this.list) {
    this.list.remove(name);
    return this;
  }

  // fallback
  var arr = this.array();
  var i = index(arr, name);
  if (~i) arr.splice(i, 1);
  this.el.className = arr.join(' ');
  return this;
};

/**
 * Remove all classes matching `re`.
 *
 * @param {RegExp} re
 * @return {ClassList}
 * @api private
 */

ClassList.prototype.removeMatching = function(re){
  var arr = this.array();
  for (var i = 0; i < arr.length; i++) {
    if (re.test(arr[i])) {
      this.remove(arr[i]);
    }
  }
  return this;
};

/**
 * Toggle class `name`, can force state via `force`.
 *
 * For browsers that support classList, but do not support `force` yet,
 * the mistake will be detected and corrected.
 *
 * @param {String} name
 * @param {Boolean} force
 * @return {ClassList}
 * @api public
 */

ClassList.prototype.toggle = function(name, force){
  // classList
  if (this.list) {
    if ("undefined" !== typeof force) {
      if (force !== this.list.toggle(name, force)) {
        this.list.toggle(name); // toggle again to correct
      }
    } else {
      this.list.toggle(name);
    }
    return this;
  }

  // fallback
  if ("undefined" !== typeof force) {
    if (!force) {
      this.remove(name);
    } else {
      this.add(name);
    }
  } else {
    if (this.has(name)) {
      this.remove(name);
    } else {
      this.add(name);
    }
  }

  return this;
};

/**
 * Return an array of classes.
 *
 * @return {Array}
 * @api public
 */

ClassList.prototype.array = function(){
  var str = this.el.className.replace(/^\s+|\s+$/g, '');
  var arr = str.split(re);
  if ('' === arr[0]) arr.shift();
  return arr;
};

/**
 * Check if class `name` is present.
 *
 * @param {String} name
 * @return {ClassList}
 * @api public
 */

ClassList.prototype.has =
ClassList.prototype.contains = function(name){
  return this.list
    ? this.list.contains(name)
    : !! ~index(this.array(), name);
};

}, {"indexof":20}],
20: [function(require, module, exports) {
module.exports = function(arr, obj){
  if (arr.indexOf) return arr.indexOf(obj);
  for (var i = 0; i < arr.length; ++i) {
    if (arr[i] === obj) return i;
  }
  return -1;
};
}, {}],
17: [function(require, module, exports) {

/**
 * Retrieves a form control from the given root element. The ideal use-case is for
 * a `<form>` or `<fieldset>`, (via their `elements` API) but arbitrary DOM elements
 * work as well. (via `querySelectorAll`)
 *
 * @param {HTMLElement} root
 * @param {String} name
 *
 * @returns {Mixed}
 */

module.exports = function (root, name) {
    if (!(root instanceof HTMLElement)) {
        throw new TypeError("a root element is required");
    }

    if ("namedItem" in root) {
        // the short-circuit here is because IE won't find things like <fieldset> even
        // when they have an assigned name
        return normalize(root.namedItem(name) || bruteForce(root, name));
    } else if (root.elements) {
        return normalize(root.elements.namedItem(name));
    } else {
        return normalize(bruteForce(root, name));
    }
};


/**
 * When searching an arbitrary element (or for browsers that don't support
 * the elements list properly)
 *
 * @param {HTMLElement} root
 * @param {String} name
 *
 * @return {NodeList}
 */
function bruteForce(root, name) {
    return root.querySelectorAll("[name='" + name + "']");
}

/**
 * Normalizes the value returned by the API:
 *  - when empty, return `null`
 *  - when only a single node, return that node directly
 *  - when a `NodeList`, return an `Array` instead
 *
 * @param {Mixed} ret
 *
 * @return {Mixed}
 */
function normalize(ret) {
    if (!ret) {
        return null;
    } else if (ret instanceof HTMLElement) {
        return ret;
    } else if (ret.length === 0) {
        return null;
    } else if (ret.length === 1) {
        return ret[0];
    } else {
        return [].slice.call(ret);
    }
}

}, {}],
18: [function(require, module, exports) {
// dependencies
var controls = require("form-controls");
var reduce = require("reduce");
var square = require("square");
var value = require("value");
var submittable = require("submittable");


/**
 * Retrieves a single JS object representing the values filled in
 * the `form` element's controls.
 *
 * @param  {HTMLElement} form      @see dominicbarnes/form-controls
 * @param  {Function} transformer  Allows intercepting and transforming values
 * @return {Object}
 */

module.exports = function (form, transformer) {
    return reduce(controls(form), function (acc, el) {
        if (!submittable(el)) return acc;
        var val = transformer ? transformer.call(form, el.name, value(el), el) : value(el);
        return square.set(acc, el.name, val);
    }, {});
};

}, {"form-controls":21,"reduce":22,"square":23,"value":19,"submittable":24}],
21: [function(require, module, exports) {
// dependencies
var toArray = require("to-array");

var bruteForce = [
    "button",
    "fieldset",
    "input",
    "keygen",
    "object",
    "output",
    "select",
    "textarea"
].join(",");


/**
 * Retrieves a list of valid controls from a given root element.
 *
 * If the `root` element is not either a `<form>` or `<fieldset>`, or does not
 * expose a `HTMLFormControlCollection` interface, then a "brute-force" search
 * retrieves the valid "listed controls" is used.
 *
 * @see http://www.w3.org/TR/html5/forms.html#category-listed
 *
 * @param  {HTMLElement} root
 * @returns {Array:HTMLElement}
 */

module.exports = function (root) {
    if (!root) {
        throw new TypeError("a root element is required");
    }

    return toArray(root.elements || root.querySelectorAll(bruteForce));
};

}, {"to-array":25}],
25: [function(require, module, exports) {
/**
 * Convert an array-like object into an `Array`.
 * If `collection` is already an `Array`, then will return a clone of `collection`.
 *
 * @param {Array | Mixed} collection An `Array` or array-like object to convert e.g. `arguments` or `NodeList`
 * @return {Array} Naive conversion of `collection` to a new `Array`.
 * @api public
 */

module.exports = function toArray(collection) {
  if (typeof collection === 'undefined') return []
  if (collection === null) return [null]
  if (collection === window) return [window]
  if (typeof collection === 'string') return [collection]
  if (isArray(collection)) return collection
  if (typeof collection.length != 'number') return [collection]
  if (typeof collection === 'function' && collection instanceof Function) return [collection]

  var arr = []
  for (var i = 0; i < collection.length; i++) {
    if (Object.prototype.hasOwnProperty.call(collection, i) || i in collection) {
      arr.push(collection[i])
    }
  }
  if (!arr.length) return []
  return arr
}

function isArray(arr) {
  return Object.prototype.toString.call(arr) === "[object Array]";
}

}, {}],
22: [function(require, module, exports) {

/**
 * dependencies
 */

var each = require('each');

/**
 * Export `reduce`
 */

module.exports = reduce;

/**
 * Reduce `obj` with `fn`.
 *
 * @param {Mixed} obj
 * @param {Function} fn
 * @param {Mixed} val
 * @api public
 */

function reduce(obj, fn, val){
  each(obj, function(a, b){
    val = fn.apply(null, [val, a, b]);
  });
  return val;
}

}, {"each":26}],
26: [function(require, module, exports) {

/**
 * Module dependencies.
 */

try {
  var type = require('type');
} catch (err) {
  var type = require('component-type');
}

var toFunction = require('to-function');

/**
 * HOP reference.
 */

var has = Object.prototype.hasOwnProperty;

/**
 * Iterate the given `obj` and invoke `fn(val, i)`
 * in optional context `ctx`.
 *
 * @param {String|Array|Object} obj
 * @param {Function} fn
 * @param {Object} [ctx]
 * @api public
 */

module.exports = function(obj, fn, ctx){
  fn = toFunction(fn);
  ctx = ctx || this;
  switch (type(obj)) {
    case 'array':
      return array(obj, fn, ctx);
    case 'object':
      if ('number' == typeof obj.length) return array(obj, fn, ctx);
      return object(obj, fn, ctx);
    case 'string':
      return string(obj, fn, ctx);
  }
};

/**
 * Iterate string chars.
 *
 * @param {String} obj
 * @param {Function} fn
 * @param {Object} ctx
 * @api private
 */

function string(obj, fn, ctx) {
  for (var i = 0; i < obj.length; ++i) {
    fn.call(ctx, obj.charAt(i), i);
  }
}

/**
 * Iterate object keys.
 *
 * @param {Object} obj
 * @param {Function} fn
 * @param {Object} ctx
 * @api private
 */

function object(obj, fn, ctx) {
  for (var key in obj) {
    if (has.call(obj, key)) {
      fn.call(ctx, key, obj[key]);
    }
  }
}

/**
 * Iterate array-ish.
 *
 * @param {Array|Object} obj
 * @param {Function} fn
 * @param {Object} ctx
 * @api private
 */

function array(obj, fn, ctx) {
  for (var i = 0; i < obj.length; ++i) {
    fn.call(ctx, obj[i], i);
  }
}

}, {"type":27,"component-type":27,"to-function":28}],
27: [function(require, module, exports) {

/**
 * toString ref.
 */

var toString = Object.prototype.toString;

/**
 * Return the type of `val`.
 *
 * @param {Mixed} val
 * @return {String}
 * @api public
 */

module.exports = function(val){
  switch (toString.call(val)) {
    case '[object Function]': return 'function';
    case '[object Date]': return 'date';
    case '[object RegExp]': return 'regexp';
    case '[object Arguments]': return 'arguments';
    case '[object Array]': return 'array';
    case '[object String]': return 'string';
  }

  if (val === null) return 'null';
  if (val === undefined) return 'undefined';
  if (val && val.nodeType === 1) return 'element';
  if (val === Object(val)) return 'object';

  return typeof val;
};

}, {}],
28: [function(require, module, exports) {

/**
 * Module Dependencies
 */

var expr;
try {
  expr = require('props');
} catch(e) {
  expr = require('component-props');
}

/**
 * Expose `toFunction()`.
 */

module.exports = toFunction;

/**
 * Convert `obj` to a `Function`.
 *
 * @param {Mixed} obj
 * @return {Function}
 * @api private
 */

function toFunction(obj) {
  switch ({}.toString.call(obj)) {
    case '[object Object]':
      return objectToFunction(obj);
    case '[object Function]':
      return obj;
    case '[object String]':
      return stringToFunction(obj);
    case '[object RegExp]':
      return regexpToFunction(obj);
    default:
      return defaultToFunction(obj);
  }
}

/**
 * Default to strict equality.
 *
 * @param {Mixed} val
 * @return {Function}
 * @api private
 */

function defaultToFunction(val) {
  return function(obj){
    return val === obj;
  };
}

/**
 * Convert `re` to a function.
 *
 * @param {RegExp} re
 * @return {Function}
 * @api private
 */

function regexpToFunction(re) {
  return function(obj){
    return re.test(obj);
  };
}

/**
 * Convert property `str` to a function.
 *
 * @param {String} str
 * @return {Function}
 * @api private
 */

function stringToFunction(str) {
  // immediate such as "> 20"
  if (/^ *\W+/.test(str)) return new Function('_', 'return _ ' + str);

  // properties such as "name.first" or "age > 18" or "age > 18 && age < 36"
  return new Function('_', 'return ' + get(str));
}

/**
 * Convert `object` to a function.
 *
 * @param {Object} object
 * @return {Function}
 * @api private
 */

function objectToFunction(obj) {
  var match = {};
  for (var key in obj) {
    match[key] = typeof obj[key] === 'string'
      ? defaultToFunction(obj[key])
      : toFunction(obj[key]);
  }
  return function(val){
    if (typeof val !== 'object') return false;
    for (var key in match) {
      if (!(key in val)) return false;
      if (!match[key](val[key])) return false;
    }
    return true;
  };
}

/**
 * Built the getter function. Supports getter style functions
 *
 * @param {String} str
 * @return {String}
 * @api private
 */

function get(str) {
  var props = expr(str);
  if (!props.length) return '_.' + str;

  var val, i, prop;
  for (i = 0; i < props.length; i++) {
    prop = props[i];
    val = '_.' + prop;
    val = "('function' == typeof " + val + " ? " + val + "() : " + val + ")";

    // mimic negative lookbehind to avoid problems with nested properties
    str = stripNested(prop, str, val);
  }

  return str;
}

/**
 * Mimic negative lookbehind to avoid problems with nested properties.
 *
 * See: http://blog.stevenlevithan.com/archives/mimic-lookbehind-javascript
 *
 * @param {String} prop
 * @param {String} str
 * @param {String} val
 * @return {String}
 * @api private
 */

function stripNested (prop, str, val) {
  return str.replace(new RegExp('(\\.)?' + prop, 'g'), function($0, $1) {
    return $1 ? $0 : val;
  });
}

}, {"props":29,"component-props":29}],
29: [function(require, module, exports) {
/**
 * Global Names
 */

var globals = /\b(this|Array|Date|Object|Math|JSON)\b/g;

/**
 * Return immediate identifiers parsed from `str`.
 *
 * @param {String} str
 * @param {String|Function} map function or prefix
 * @return {Array}
 * @api public
 */

module.exports = function(str, fn){
  var p = unique(props(str));
  if (fn && 'string' == typeof fn) fn = prefixed(fn);
  if (fn) return map(str, p, fn);
  return p;
};

/**
 * Return immediate identifiers in `str`.
 *
 * @param {String} str
 * @return {Array}
 * @api private
 */

function props(str) {
  return str
    .replace(/\.\w+|\w+ *\(|"[^"]*"|'[^']*'|\/([^/]+)\//g, '')
    .replace(globals, '')
    .match(/[$a-zA-Z_]\w*/g)
    || [];
}

/**
 * Return `str` with `props` mapped with `fn`.
 *
 * @param {String} str
 * @param {Array} props
 * @param {Function} fn
 * @return {String}
 * @api private
 */

function map(str, props, fn) {
  var re = /\.\w+|\w+ *\(|"[^"]*"|'[^']*'|\/([^/]+)\/|[a-zA-Z_]\w*/g;
  return str.replace(re, function(_){
    if ('(' == _[_.length - 1]) return fn(_);
    if (!~props.indexOf(_)) return _;
    return fn(_);
  });
}

/**
 * Return unique array.
 *
 * @param {Array} arr
 * @return {Array}
 * @api private
 */

function unique(arr) {
  var ret = [];

  for (var i = 0; i < arr.length; i++) {
    if (~ret.indexOf(arr[i])) continue;
    ret.push(arr[i]);
  }

  return ret;
}

/**
 * Map with prefix `str`.
 */

function prefixed(str) {
  return function(_){
    return str + _;
  };
}

}, {}],
23: [function(require, module, exports) {

exports.parse = function (name) {
    return name.split("[").map(function (part) {
        // strip the "]" from the string, it's not needed after the split
        part = part.replace(/\]$/, "");

        // if the string is now empty, we're dealing with an array
        if (!part) return false;

        // if the key is just numbers, parse it
        if (/^\d+$/.test(part)) return parseInt(part, 10);

        // otherwise, return string key name
        return part;
    });
};

exports.set = function (o, key, value) {
    if (!o) o = {}; // create an empty object if needed

    return exports.parse(key).reduce(function (acc, branch, x, branches) {
        // while we are setting the various branches on our object
        if (x + 1 < branches.length) {
            // we need to see what key is coming next
            var nextKey = branches[x + 1];

            // when working with an array
            if (branch === false) {
                // first inspect the last item on the array
                var temp = acc[acc.length - 1];

                if (!temp || branchesExist(temp, branches.slice(x + 1))) {
                    temp = {};
                    acc.push(temp);
                }

                return temp;
            } else {
                // when the branch does not already exist
                if (!(branch in acc)) {
                    // depending on nextKey, we may be setting an array or an object
                    acc[branch] = (nextKey === false || typeof nextKey === "number") ? [] : {};
                }

                return acc[branch];
            }
        // the last iteration just sets a simple property / appends to an array
        } else {
            if (branch === false) {
                acc.push(value);
            } else {
                acc[branch] = value;
            }

            return o;
        }
    }, o);
};

function branchesExist(o, branches) {
    var current = o;
    return branches.every(function (branch) {
        if (branch in current) {
            current = current[branch];
            return true;
        } else {
            return false;
        }
    });
}

}, {}],
19: [function(require, module, exports) {

/**
 * Module dependencies.
 */

var typeOf = require('type');

/**
 * Set or get `el`'s' value.
 *
 * @param {Element} el
 * @param {Mixed} val
 * @return {Mixed}
 * @api public
 */

module.exports = function(el, val){
  if (2 == arguments.length) return set(el, val);
  return get(el);
};

/**
 * Get `el`'s value.
 */

function get(el) {
  switch (type(el)) {
    case 'checkbox':
    case 'radio':
      if (el.checked) {
        var attr = el.getAttribute('value');
        return null == attr ? true : attr;
      } else {
        return false;
      }
    case 'radiogroup':
      for (var i = 0, radio; radio = el[i]; i++) {
        if (radio.checked) return radio.value;
      }
      break;
    case 'select':
      for (var i = 0, option; option = el.options[i]; i++) {
        if (option.selected) return option.value;
      }
      break;
    default:
      return el.value;
  }
}

/**
 * Set `el`'s value.
 */

function set(el, val) {
  switch (type(el)) {
    case 'checkbox':
    case 'radio':
      if (val) {
        el.checked = true;
      } else {
        el.checked = false;
      }
      break;
    case 'radiogroup':
      for (var i = 0, radio; radio = el[i]; i++) {
        radio.checked = radio.value === val;
      }
      break;
    case 'select':
      for (var i = 0, option; option = el.options[i]; i++) {
        option.selected = option.value === val;
      }
      break;
    default:
      el.value = val;
  }
}

/**
 * Element type.
 */

function type(el) {
  var group = 'array' == typeOf(el) || 'object' == typeOf(el);
  if (group) el = el[0];
  var name = el.nodeName.toLowerCase();
  var type = el.getAttribute('type');

  if (group && type && 'radio' == type.toLowerCase()) return 'radiogroup';
  if ('input' == name && type && 'checkbox' == type.toLowerCase()) return 'checkbox';
  if ('input' == name && type && 'radio' == type.toLowerCase()) return 'radio';
  if ('select' == name) return 'select';
  return name;
}

}, {"type":30}],
30: [function(require, module, exports) {
/**
 * toString ref.
 */

var toString = Object.prototype.toString;

/**
 * Return the type of `val`.
 *
 * @param {Mixed} val
 * @return {String}
 * @api public
 */

module.exports = function(val){
  switch (toString.call(val)) {
    case '[object Date]': return 'date';
    case '[object RegExp]': return 'regexp';
    case '[object Arguments]': return 'arguments';
    case '[object Array]': return 'array';
    case '[object Error]': return 'error';
  }

  if (val === null) return 'null';
  if (val === undefined) return 'undefined';
  if (val !== val) return 'nan';
  if (val && val.nodeType === 1) return 'element';

  val = val.valueOf
    ? val.valueOf()
    : Object.prototype.valueOf.apply(val)

  return typeof val;
};

}, {}],
24: [function(require, module, exports) {

/**
 * Check if the given `el` is submittable.
 *
 * @param {Element}
 * @return {Boolean}
 */

module.exports = function(el){
  return ! el.disabled
    && el.name
    && ! rtype.test(el.type)
    && rname.test(el.nodeName)
    && (!rcheck.test(el.type)
    || el.checked);
};

/**
 * expr's
 */

var rtype = /^(?:submit|button|image|reset|file)$/i;
var rname = /^(?:input|select|textarea|keygen)$/i;
var rcheck = /^(?:checkbox|radio)$/i;

}, {}],
11: [function(require, module, exports) {

var create = require('create-event');


/**
 * Expose `trigger`.
 */

module.exports = trigger;


/**
 * Trigger an event of `type` on an `el` with `options`.
 *
 * @param {Element} el
 * @param {String} type
 * @param {Object} options
 */

function trigger (el, type, options) {

  // default el is `document`
  if ('string' === typeof el) {
    options = type;
    type = el;
    el = document;
  }

  var e = create(type, options);
  el.dispatchEvent
    ? el.dispatchEvent(e)
    : el.fireEvent(ieify(type), e);
}


/**
 * Convert a type into an IE-specific type.
 *
 * @param {String} type
 * @return {String}
 */

function ieify (type) {
  return 'on' + type[0].toUpperCase() + type.slice(1);
}
}, {"create-event":31}],
31: [function(require, module, exports) {

var extend = require('extend')
  , keycode = require('keycode');


/**
 * Expose `createEvent`.
 */

module.exports = !!document.createEvent
  ? createEvent
  : createIeEvent;


/**
 * Default options.
 */

var defaults = {
  alt           : false,
  bubbles       : true,
  button        : 0,
  cancelable    : true,
  clientX       : 0,
  clientY       : 0,
  ctrl          : false,
  detail        : 1,
  key           : 0,
  meta          : false,
  relatedTarget : null,
  screenX       : 0,
  screenY       : 0,
  shift         : false,
  view          : window
};


/**
 * Create a non-IE event object.
 *
 * @param {String} type
 * @param {Object} options
 */

function createEvent (type, options) {
  switch (type) {
    case 'dblclick':
    case 'click':
      return createMouseEvent(type, options);
    case 'keydown':
    case 'keyup':
      return createKeyboardEvent(type, options);
  }
}


/**
 * Create a non-IE mouse event.
 *
 * @param {String} type
 * @param {Object} options
 */

function createMouseEvent (type, options) {
  options = clean(type, options);
  var e = document.createEvent('MouseEvent');
  e.initMouseEvent(
    type,
    options.bubbles,      // bubbles?
    options.cancelable,   // cancelable?
    options.view,         // view
    options.detail,       // detail
    options.screenX,      // screenX
    options.screenY,      // screenY
    options.clientX ,     // clientX
    options.clientY,      // clientY
    options.ctrl,         // ctrlKey
    options.alt,          // altKey
    options.shift,        // shiftKey
    options.meta,         // metaKey
    options.button,       // button
    options.relatedTarget // relatedTarget
  );
  return e;
}


/**
 * Create a non-IE keyboard event.
 *
 * @param {String} type
 * @param {Object} options
 */

function createKeyboardEvent (type, options) {
  options = clean(type, options);
  var e = document.createEvent('KeyboardEvent');
  (e.initKeyEvent || e.initKeyboardEvent).call(
    e,
    type,
    options.bubbles,    // bubbles?
    options.cancelable, // cancelable?
    options.view,       // view
    options.ctrl,       // ctrlKey
    options.alt,        // altKey
    options.shift,      // shiftKey
    options.meta,       // metaKey
    options.key,        // keyCode
    options.key         // charCode
  );

  // super hack: http://stackoverflow.com/questions/10455626/keydown-simulation-in-chrome-fires-normally-but-not-the-correct-key/10520017#10520017
  if (e.keyCode !== options.key) {
    Object.defineProperty(e, 'keyCode', {
      get: function () { return options.key; }
    });
    Object.defineProperty(e, 'charCode', {
      get: function () { return options.key; }
    });
    Object.defineProperty(e, 'which', {
      get: function () { return options.key; }
    });
    Object.defineProperty(e, 'shiftKey', {
      get: function () { return options.shift; }
    });
  }

  return e;
}


/**
 * Create an IE event. Surprisingly nicer API, eh?
 *
 * @param {String} type
 * @param {Object} options
 */

function createIeEvent (type, options) {
  options = clean(type, options);
  var e = document.createEventObject();
  e.altKey = options.alt;
  e.bubbles = options.bubbles;
  e.button = options.button;
  e.cancelable = options.cancelable;
  e.clientX = options.clientX;
  e.clientY = options.clientY;
  e.ctrlKey = options.ctrl;
  e.detail = options.detail;
  e.metaKey = options.meta;
  e.screenX = options.screenX;
  e.screenY = options.screenY;
  e.shiftKey = options.shift;
  e.keyCode = options.key;
  e.charCode = options.key;
  e.view = options.view;
  return e;
}


/**
 * Back an `options` object by defaults, and convert some convenience features.
 *
 * @param {String} type
 * @param {Object} options
 * @return {Object} [description]
 */

function clean (type, options) {
  options = extend({}, defaults, options);
  if ('dblclick' === type) options.detail = 2;
  if ('string' === typeof options.key) options.key = keycode(options.key);
  return options;
}

}, {"extend":32,"keycode":33}],
32: [function(require, module, exports) {

module.exports = function extend (object) {
    // Takes an unlimited number of extenders.
    var args = Array.prototype.slice.call(arguments, 1);

    // For each extender, copy their properties on our object.
    for (var i = 0, source; source = args[i]; i++) {
        if (!source) continue;
        for (var property in source) {
            object[property] = source[property];
        }
    }

    return object;
};
}, {}],
33: [function(require, module, exports) {
// Source: http://jsfiddle.net/vWx8V/
// http://stackoverflow.com/questions/5603195/full-list-of-javascript-keycodes



/**
 * Conenience method returns corresponding value for given keyName or keyCode.
 *
 * @param {Mixed} keyCode {Number} or keyName {String}
 * @return {Mixed}
 * @api public
 */

exports = module.exports = function(searchInput) {
  // Keyboard Events
  if (searchInput && 'object' === typeof searchInput) {
    var hasKeyCode = searchInput.which || searchInput.keyCode || searchInput.charCode
    if (hasKeyCode) searchInput = hasKeyCode
  }

  // Numbers
  if ('number' === typeof searchInput) return names[searchInput]

  // Everything else (cast to string)
  var search = String(searchInput)

  // check codes
  var foundNamedKey = codes[search.toLowerCase()]
  if (foundNamedKey) return foundNamedKey

  // check aliases
  var foundNamedKey = aliases[search.toLowerCase()]
  if (foundNamedKey) return foundNamedKey

  // weird character?
  if (search.length === 1) return search.charCodeAt(0)

  return undefined
}

/**
 * Get by name
 *
 *   exports.code['enter'] // => 13
 */

var codes = exports.code = exports.codes = {
  'backspace': 8,
  'tab': 9,
  'enter': 13,
  'shift': 16,
  'ctrl': 17,
  'alt': 18,
  'pause/break': 19,
  'caps lock': 20,
  'esc': 27,
  'space': 32,
  'page up': 33,
  'page down': 34,
  'end': 35,
  'home': 36,
  'left': 37,
  'up': 38,
  'right': 39,
  'down': 40,
  'insert': 45,
  'delete': 46,
  'windows': 91,
  'command': 91,
  'right click': 93,
  'numpad *': 106,
  'numpad +': 107,
  'numpad -': 109,
  'numpad .': 110,
  'numpad /': 111,
  'num lock': 144,
  'scroll lock': 145,
  'my computer': 182,
  'my calculator': 183,
  ';': 186,
  '=': 187,
  ',': 188,
  '-': 189,
  '.': 190,
  '/': 191,
  '`': 192,
  '[': 219,
  '\\': 220,
  ']': 221,
  "'": 222,
  '⇧': 16,
  '⌥': 18,
  '⌃': 17,
  '⌘': 91,
}

// Helper aliases

var aliases = exports.aliases = {
  'shift': 16,
  'ctl': 17,
  'ctrl': 17,
  'control': 17,
  'alt': 18,
  'option': 18,
  'pause': 19,
  'break': 19,
  'caps': 20,
  'escape': 27,
  'spc': 32,
  'pgup': 33,
  'pgdn': 33,
  'ins': 45,
  'del': 46,
  'cmd': 91
}


/*!
 * Programatically add the following
 */

// lower case chars
for (i = 97; i < 123; i++) codes[String.fromCharCode(i)] = i - 32

// numbers
for (var i = 48; i < 58; i++) codes[i - 48] = i

// function keys
for (i = 1; i < 13; i++) codes['f'+i] = i + 111

// numpad keys
for (i = 0; i < 10; i++) codes['numpad '+i] = i + 96

/**
 * Get by code
 *
 *   exports.name[13] // => 'Enter'
 */

var names = exports.names = exports.title = {} // title for backward compat

// Create reverse mapping
for (i in codes) names[codes[i]] = i

// Add aliases
for (var alias in aliases) {
  codes[alias] = aliases[alias]
}

}, {}],
6: [function(require, module, exports) {
/**
 * Module dependencies
 */

var Step = require('step.js');
var noop = function() {};

/**
 * Export `Rube`
 */

module.exports = Rube;

/**
 * Initialize `Rube`
 *
 * @return {Rube}
 * @api public
 */

function Rube() {
  if (!(this instanceof Rube)) return new Rube();
  var pipeline = [];

  function rube(actual, fn) {
    Step(pipeline).run(actual, function(err, v) {
      return err
        ? fn(rube._message(err))
        : fn(null, v);
    });
  }

  rube._pipeline = pipeline;
  rube._message = function(err) { return err; }

  // add the methods
  for (var k in Rube.prototype) {
    rube[k] = Rube.prototype[k];
  }

  return rube;
}

/**
 * Attach a custom method to Rube instances
 *
 * @param {String} name
 * @param {Function} fn
 * @return {Rube}
 * @api public
 */

Rube.plugin = function(name, fn) {
  if (arguments.length == 1) {
    fn = name;
    name = fn.name;
  }

  if (!name) throw new Error('Rube.plugin(name, fn) requires a name');

  // add the method
  this.prototype[name.toLowerCase()] = function() {
    var ret = fn.apply(null, arguments);
    this._pipeline.push(ret || noop);
    return this;
  };

  return this;
}

/**
 * Add a plugin a rube instance
 *
 * @param {Function} fn
 * @return {Rube}
 * @api public
 */

Rube.prototype.use = function(fn) {
  this._pipeline.push(fn);
  return this;
};

/**
 * Add a custom error message
 *
 * @param {Mixed} msg
 * @return {Rube}
 */

Rube.prototype.message = function(msg) {
  this._message = 'string' == typeof msg
    ? function() { return new TypeError(msg); }
    : msg instanceof Error
    ? function() { return msg; }
    : msg;

  return this;
};

/**
 * Bundled plugins
 */

Rube.plugin('default', require('./lib/default.js'));
Rube.plugin('required', require('./lib/required.js'));
Rube.plugin('between', require('./lib/between.js'));
Rube.plugin('format', require('./lib/format.js'));
Rube.plugin('assert', require('./lib/assert.js'));
Rube.plugin('cast', require('./lib/cast.js'));
Rube.plugin('type', require('./lib/type.js'));

}, {"step.js":34,"./lib/default.js":35,"./lib/required.js":36,"./lib/between.js":37,"./lib/format.js":38,"./lib/assert.js":39,"./lib/cast.js":40,"./lib/type.js":41}],
34: [function(require, module, exports) {
/**
 * Module Dependencies
 */

var slice = Array.prototype.slice;
var noop = function() {};
var co = require('co');

/**
 * Export `Step`
 */

module.exports = Step;

/**
 * Initialize `Step`
 *
 * @param {Mixed} fn (optional)
 * @return {Step}
 * @api public
 */

function Step(fn) {
  if (!(this instanceof Step)) return new Step(fn);
  this.fns = [];
  this.length = 0;
  fn && this.use(fn);
}

/**
 * Add a step
 *
 * @param {Function|Generator|Array} fn
 * @return {Step}
 * @api public
 */

Step.prototype.use = function(fn) {
  if (fn instanceof Step) this.fns = this.fns.concat(fn.fns);
  else if (fn instanceof Array) this.fns = this.fns.concat(fn);
  else this.fns.push(fn);
  this.length = this.fns.length;
  return this;
};

/**
 * Run the steps
 *
 * @param {Args...} args
 * @param {Function} fn
 * @api public
 */

Step.prototype.run = function() {
  var args = slice.call(arguments);
  var fns = slice.call(this.fns);
  var len = args.length;
  var ctx = this;

  // callback or noop
  var done = 'function' == typeof args[len - 1]
    ? args.pop()
    : noop;

  // kick us off
  // next tick to ensure we're async (no double callbacks)
  setTimeout(function() {
    call(fns.shift(), args);
  }, 0);

  // next
  function next(err) {
    if (err) return done(err);
    var arr = slice.call(arguments, 1);
    args = extend(args, arr);
    var fn = fns.shift();
    call(fn, args);
  }

  // call
  function call(fn, args) {
    if (!fn) {
      return done.apply(done, [null].concat(args));
    } else if (fn.length > args.length) {
      fn.apply(ctx, args.concat(next));
    } else if (generator(fn)) {
      co(fn).apply(ctx, args.concat(next));
    } else {
      var ret = fn.apply(ctx, args);
      ret instanceof Error ? next(ret) : next(null, ret);
    }
  }
};

/**
 * Pull values from another array
 * @param  {Array} a
 * @param  {Array} b
 * @return {Array}
 */

function extend(a, b) {
  var len = a.length;
  var out = [];

  for (var i = 0; i < len; i++) {
    out[i] = undefined === b[i] ? a[i] : b[i];
  }

  return out;
}

/**
 * Is generator?
 *
 * @param {Mixed} value
 * @return {Boolean}
 * @api private
 */

function generator(value){
  return value
    && value.constructor
    && 'GeneratorFunction' == value.constructor.name;
}

}, {"co":42}],
42: [function(require, module, exports) {

/**
 * slice() reference.
 */

var slice = Array.prototype.slice;

/**
 * Expose `co`.
 */

module.exports = co['default'] = co.co = co;

/**
 * Wrap the given generator `fn` into a
 * function that returns a promise.
 * This is a separate function so that
 * every `co()` call doesn't create a new,
 * unnecessary closure.
 *
 * @param {GeneratorFunction} fn
 * @return {Function}
 * @api public
 */

co.wrap = function (fn) {
  return function () {
    return co.call(this, fn.apply(this, arguments));
  };
};

/**
 * Execute the generator function or a generator
 * and return a promise.
 *
 * @param {Function} fn
 * @return {Function}
 * @api public
 */

function co(gen) {
  var ctx = this;
  if (typeof gen === 'function') gen = gen.call(this);
  return Promise.resolve(onFulfilled());

  /**
   * @param {Mixed} res
   * @return {Promise}
   * @api private
   */

  function onFulfilled(res) {
    var ret;
    try {
      ret = gen.next(res);
    } catch (e) {
      return Promise.reject(e);
    }
    return next(ret);
  }

  /**
   * @param {Error} err
   * @return {Promise}
   * @api private
   */

  function onRejected(err) {
    var ret;
    try {
      ret = gen.throw(err);
    } catch (e) {
      return Promise.reject(e);
    }
    return next(ret);
  }

  /**
   * Get the next value in the generator,
   * return a promise.
   *
   * @param {Object} ret
   * @return {Promise}
   * @api private
   */

  function next(ret) {
    if (ret.done) return Promise.resolve(ret.value);
    var value = toPromise.call(ctx, ret.value);
    if (value && isPromise(value)) return value.then(onFulfilled, onRejected);
    return onRejected(new TypeError('You may only yield a function, promise, generator, array, or object, '
      + 'but the following object was passed: "' + String(ret.value) + '"'));
  }
}

/**
 * Convert a `yield`ed value into a promise.
 *
 * @param {Mixed} obj
 * @return {Promise}
 * @api private
 */

function toPromise(obj) {
  if (!obj) return obj;
  if (isPromise(obj)) return obj;
  if (isGeneratorFunction(obj) || isGenerator(obj)) return co.call(this, obj);
  if ('function' == typeof obj) return thunkToPromise.call(this, obj);
  if (Array.isArray(obj)) return arrayToPromise.call(this, obj);
  if (isObject(obj)) return objectToPromise.call(this, obj);
  return obj;
}

/**
 * Convert a thunk to a promise.
 *
 * @param {Function}
 * @return {Promise}
 * @api private
 */

function thunkToPromise(fn) {
  var ctx = this;
  return new Promise(function (resolve, reject) {
    fn.call(ctx, function (err, res) {
      if (err) return reject(err);
      if (arguments.length > 2) res = slice.call(arguments, 1);
      resolve(res);
    });
  });
}

/**
 * Convert an array of "yieldables" to a promise.
 * Uses `Promise.all()` internally.
 *
 * @param {Array} obj
 * @return {Promise}
 * @api private
 */

function arrayToPromise(obj) {
  return Promise.all(obj.map(toPromise, this));
}

/**
 * Convert an object of "yieldables" to a promise.
 * Uses `Promise.all()` internally.
 *
 * @param {Object} obj
 * @return {Promise}
 * @api private
 */

function objectToPromise(obj){
  var results = new obj.constructor();
  var keys = Object.keys(obj);
  var promises = [];
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    var promise = toPromise.call(this, obj[key]);
    if (promise && isPromise(promise)) defer(promise, key);
    else results[key] = obj[key];
  }
  return Promise.all(promises).then(function () {
    return results;
  });

  function defer(promise, key) {
    // predefine the key in the result
    results[key] = undefined;
    promises.push(promise.then(function (res) {
      results[key] = res;
    }));
  }
}

/**
 * Check if `obj` is a promise.
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api private
 */

function isPromise(obj) {
  return 'function' == typeof obj.then;
}

/**
 * Check if `obj` is a generator.
 *
 * @param {Mixed} obj
 * @return {Boolean}
 * @api private
 */

function isGenerator(obj) {
  return 'function' == typeof obj.next && 'function' == typeof obj.throw;
}

/**
 * Check if `obj` is a generator function.
 *
 * @param {Mixed} obj
 * @return {Boolean}
 * @api private
 */

function isGeneratorFunction(obj) {
  var constructor = obj.constructor;
  return constructor && 'GeneratorFunction' == constructor.name;
}

/**
 * Check for plain object.
 *
 * @param {Mixed} val
 * @return {Boolean}
 * @api private
 */

function isObject(val) {
  return Object == val.constructor;
}

}, {}],
35: [function(require, module, exports) {
/**
 * Module Dependencies
 */

var type = require('./utils/type');

/**
 * Export `Default`
 */

module.exports = Default;

/**
 * Set the value if `undefined`
 */

function Default(def) {
  return function(value) {
    switch(type(value)) {
      case 'undefined':
        return def;
      default:
        return value;
    }
  };
}

}, {"./utils/type":43}],
43: [function(require, module, exports) {
try {
  var t = require('type');
} catch (e) {
  var t = require('type-component');
}

/**
 * Expose `type`
 */

module.exports = type;

/**
 * Get the type
 *
 * @param {Mixed} val
 * @return {String} type
 */

function type(val) {
  switch(val) {
    case undefined: return 'undefined';
    case Function: return 'function';
    case Boolean: return 'boolean';
    case Number: return 'number';
    case String: return 'string';
    case RegExp: return 'regexp';
    case Object: return 'object';
    case Array: return 'Array';
    case Date: return 'date';
    case null: return 'null';
    case NaN: return 'nan';
    default: return t(val);
  }
}

}, {"type":27}],
36: [function(require, module, exports) {
/**
 * Module dependencies
 */

var type = require('./utils/type');

/**
 * Export `Require`
 */

module.exports = Required;

/**
 * Require a value. Cannot be `undefined`.
 */

function Required() {
  return function(value) {
    switch(type(value)) {
      case 'undefined': return new TypeError('value must be defined');
      case 'string': return value.length == 0
        ? new TypeError('value cannot be blank')
        : value;
      default: return value;
    }
  }
}

}, {"./utils/type":43}],
37: [function(require, module, exports) {
/**
 * Module dependencies
 */

var fmt = require('./utils/format');
var type = require('./utils/type');

/**
 * Errors
 */

var minmsg = 'length must be greater than or equal to %s';
var maxmsg = 'length must be less than or equal to %s';

/**
 * Export `Between`
 */

module.exports = Between;

/**
 * Between a value. Cannot be `undefined`.
 */

function Between(min, max) {
  return function(value) {
    var len = value.length === undefined ? value : value.length;

    return len < min
      ? new RangeError(fmt(minmsg, min))
      : len > max
      ? new RangeError(fmt(maxmsg, max))
      : value;
  }
}

}, {"./utils/format":44,"./utils/type":43}],
44: [function(require, module, exports) {
try {
  module.exports = require('fmt');
} catch (e) {
  module.exports = require('util').format;
}

}, {"fmt":13}],
38: [function(require, module, exports) {
/**
 * Module dependencies
 */

var type = require('./utils/type.js');
var rrep = /(\$(`|&|'|\d+))/g;
var noop = function() {};
var slice = [].slice;

/**
 * Export `Format`
 */

module.exports = Format;

/**
 * Initialize `Format`
 *
 * @param {RegExp|Function} formatter
 * @param {String|Function} format
 */

function Format(formatter, format) {
  return 1 == arguments.length
    ? func(formatter)
    : regex(formatter, format);
}

/**
 * Regular format function
 *
 * @param {Function} fn
 * @return {Function}
 */

function func(fn) {
  return function(value) {
    return fn(value);
  }
}

/**
 * Regex based formatting
 *
 * @param {Regexp} regex
 * @param {String|Function} rep
 */

function regex(regex, rep) {
  var global = !!regex.global;

  rep = arguments.length > 1 ? rep : noop;
  rep = 'function' == typeof rep ? rep : compile(rep);

  return function(value) {
    return (value + '').replace(regex, function() {
      var m = slice.call(arguments);
      var i = 1;

      // remove extra stuff if not global
      if (!global) {
        while(m[i] && 'string' == type(m[i])) i++;
        m = m.slice(0, i);
      }

      return rep(m);
    });
  }
}

/**
 * Compile the replacer
 *
 * @param {String} str
 * @return {String}
 */

function compile(str) {
  var expr = str.replace(rrep, function(m) {
    var out = '\' + ($[';
    out += '&' == m[1] ? 0 : m[1];
    out += '] || \'\') + \'';
    return out;
  })

  expr = '\'' + expr + '\'';
  return new Function('$', 'return ' + expr);
}

}, {"./utils/type.js":43}],
39: [function(require, module, exports) {
/**
 * Module dependencies
 */

var fmt = require('./utils/format');
var type = require('./utils/type');
var assert = require('assert');
var wrap = require('wrap-fn');

/**
 * Export `Assert`
 */

module.exports = Assert;

/**
 * Assert a value. Cannot be `undefined`.
 */

function Assert(expected, msg) {
  if ('function' == typeof expected) return func(expected);

  var fn = compile(expected, msg);

  return function(value) {
    try {
      fn(value);
    } catch (e) {
      return e;
    }
  }
}

/**
 * Compile the assertion
 */

function compile(expected, msg) {
  switch(type(expected)) {
    case 'regexp': return regex(expected, msg);
    case 'object':
    case 'array':
      return object(expected, msg)
    default:
      return misc(expected, msg);
  }
}

function func(fn) {
  return function(value, done) {
    wrap(fn, function(err, v) {
      try {
        if (err) throw err;
        assert(v);
        done()
      } catch (e) {
        done(e);
      }
    })(value);
  }
}

/**
 * Regex assertion
 */

function regex(expected, msg) {
  return function(value) {
    msg = msg || fmt('"%s" does not match "%s"', value, expected);
    assert(expected.test(value), msg);
  }
}

/**
 * Deep equality on objects and arrays
 */

function object(expected, msg) {
  return function(value) {
    assert.deepEqual(value, expected, msg);
  }
}

/**
 * Equality on everything else
 */

function misc(expected, msg) {
  return function(value) {
    assert.equal(value, expected, msg);
  }
}

}, {"./utils/format":44,"./utils/type":43,"assert":8,"wrap-fn":45}],
45: [function(require, module, exports) {
/**
 * Module Dependencies
 */

var slice = [].slice;
var co = require('co');
var noop = function(){};

/**
 * Export `wrap-fn`
 */

module.exports = wrap;

/**
 * Wrap a function to support
 * sync, async, and gen functions.
 *
 * @param {Function} fn
 * @param {Function} done
 * @return {Function}
 * @api public
 */

function wrap(fn, done) {
  done = done || noop;

  return function() {
    var args = slice.call(arguments);
    var ctx = this;

    // done
    if (!fn) {
      return done.apply(ctx, [null].concat(args));
    }

    // async
    if (fn.length > args.length) {
      return fn.apply(ctx, args.concat(done));
    }

    // generator
    if (generator(fn)) {
      return co(fn).apply(ctx, args.concat(done));
    }

    // sync
    return sync(fn, done).apply(ctx, args);
  }
}

/**
 * Wrap a synchronous function execution.
 *
 * @param {Function} fn
 * @param {Function} done
 * @return {Function}
 * @api private
 */

function sync(fn, done) {
  return function () {
    var ret;

    try {
      ret = fn.apply(this, arguments);
    } catch (err) {
      return done(err);
    }

    if (promise(ret)) {
      ret.then(function (value) { done(null, value); }, done);
    } else {
      ret instanceof Error ? done(ret) : done(null, ret);
    }
  }
}

/**
 * Is `value` a generator?
 *
 * @param {Mixed} value
 * @return {Boolean}
 * @api private
 */

function generator(value) {
  return value
    && value.constructor
    && 'GeneratorFunction' == value.constructor.name;
}


/**
 * Is `value` a promise?
 *
 * @param {Mixed} value
 * @return {Boolean}
 * @api private
 */

function promise(value) {
  return value && 'function' == typeof value.then;
}

}, {"co":46}],
46: [function(require, module, exports) {

/**
 * slice() reference.
 */

var slice = Array.prototype.slice;

/**
 * Expose `co`.
 */

module.exports = co;

/**
 * Wrap the given generator `fn` and
 * return a thunk.
 *
 * @param {Function} fn
 * @return {Function}
 * @api public
 */

function co(fn) {
  var isGenFun = isGeneratorFunction(fn);

  return function (done) {
    var ctx = this;

    // in toThunk() below we invoke co()
    // with a generator, so optimize for
    // this case
    var gen = fn;

    // we only need to parse the arguments
    // if gen is a generator function.
    if (isGenFun) {
      var args = slice.call(arguments), len = args.length;
      var hasCallback = len && 'function' == typeof args[len - 1];
      done = hasCallback ? args.pop() : error;
      gen = fn.apply(this, args);
    } else {
      done = done || error;
    }

    next();

    // #92
    // wrap the callback in a setImmediate
    // so that any of its errors aren't caught by `co`
    function exit(err, res) {
      setImmediate(function(){
        done.call(ctx, err, res);
      });
    }

    function next(err, res) {
      var ret;

      // multiple args
      if (arguments.length > 2) res = slice.call(arguments, 1);

      // error
      if (err) {
        try {
          ret = gen.throw(err);
        } catch (e) {
          return exit(e);
        }
      }

      // ok
      if (!err) {
        try {
          ret = gen.next(res);
        } catch (e) {
          return exit(e);
        }
      }

      // done
      if (ret.done) return exit(null, ret.value);

      // normalize
      ret.value = toThunk(ret.value, ctx);

      // run
      if ('function' == typeof ret.value) {
        var called = false;
        try {
          ret.value.call(ctx, function(){
            if (called) return;
            called = true;
            next.apply(ctx, arguments);
          });
        } catch (e) {
          setImmediate(function(){
            if (called) return;
            called = true;
            next(e);
          });
        }
        return;
      }

      // invalid
      next(new TypeError('You may only yield a function, promise, generator, array, or object, '
        + 'but the following was passed: "' + String(ret.value) + '"'));
    }
  }
}

/**
 * Convert `obj` into a normalized thunk.
 *
 * @param {Mixed} obj
 * @param {Mixed} ctx
 * @return {Function}
 * @api private
 */

function toThunk(obj, ctx) {

  if (isGeneratorFunction(obj)) {
    return co(obj.call(ctx));
  }

  if (isGenerator(obj)) {
    return co(obj);
  }

  if (isPromise(obj)) {
    return promiseToThunk(obj);
  }

  if ('function' == typeof obj) {
    return obj;
  }

  if (isObject(obj) || Array.isArray(obj)) {
    return objectToThunk.call(ctx, obj);
  }

  return obj;
}

/**
 * Convert an object of yieldables to a thunk.
 *
 * @param {Object} obj
 * @return {Function}
 * @api private
 */

function objectToThunk(obj){
  var ctx = this;
  var isArray = Array.isArray(obj);

  return function(done){
    var keys = Object.keys(obj);
    var pending = keys.length;
    var results = isArray
      ? new Array(pending) // predefine the array length
      : new obj.constructor();
    var finished;

    if (!pending) {
      setImmediate(function(){
        done(null, results)
      });
      return;
    }

    // prepopulate object keys to preserve key ordering
    if (!isArray) {
      for (var i = 0; i < pending; i++) {
        results[keys[i]] = undefined;
      }
    }

    for (var i = 0; i < keys.length; i++) {
      run(obj[keys[i]], keys[i]);
    }

    function run(fn, key) {
      if (finished) return;
      try {
        fn = toThunk(fn, ctx);

        if ('function' != typeof fn) {
          results[key] = fn;
          return --pending || done(null, results);
        }

        fn.call(ctx, function(err, res){
          if (finished) return;

          if (err) {
            finished = true;
            return done(err);
          }

          results[key] = res;
          --pending || done(null, results);
        });
      } catch (err) {
        finished = true;
        done(err);
      }
    }
  }
}

/**
 * Convert `promise` to a thunk.
 *
 * @param {Object} promise
 * @return {Function}
 * @api private
 */

function promiseToThunk(promise) {
  return function(fn){
    promise.then(function(res) {
      fn(null, res);
    }, fn);
  }
}

/**
 * Check if `obj` is a promise.
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api private
 */

function isPromise(obj) {
  return obj && 'function' == typeof obj.then;
}

/**
 * Check if `obj` is a generator.
 *
 * @param {Mixed} obj
 * @return {Boolean}
 * @api private
 */

function isGenerator(obj) {
  return obj && 'function' == typeof obj.next && 'function' == typeof obj.throw;
}

/**
 * Check if `obj` is a generator function.
 *
 * @param {Mixed} obj
 * @return {Boolean}
 * @api private
 */

function isGeneratorFunction(obj) {
  return obj && obj.constructor && 'GeneratorFunction' == obj.constructor.name;
}

/**
 * Check for plain object.
 *
 * @param {Mixed} val
 * @return {Boolean}
 * @api private
 */

function isObject(val) {
  return val && Object == val.constructor;
}

/**
 * Throw `err` in a new stack.
 *
 * This is used when co() is invoked
 * without supplying a callback, which
 * should only be for demonstrational
 * purposes.
 *
 * @param {Error} err
 * @api private
 */

function error(err) {
  if (!err) return;
  setImmediate(function(){
    throw err;
  });
}

}, {}],
40: [function(require, module, exports) {
/**
 * Module Dependencies
 */

var type = require('./utils/type.js');
var typecast = require('typecast');

/**
 * Export `cast`
 */

module.exports = cast;

/**
 * Initialize `cast`
 *
 * @param {Mixed} from (optional)
 * @param {Mixed} to
 */

function cast(from, to) {
  if (1 == arguments.length) {
    to = type(from);
    from = false;
  } else {
    from = type(from);
    to = type(to);
  }

  return function(value) {
    return !from || type(value) == from
      ? typecast(value, to)
      : value;
  }
}

}, {"./utils/type.js":43,"typecast":47}],
47: [function(require, module, exports) {
module.exports = typecast;

/**
 * Cast given `val` to `type`
 *
 * @param {Mixed} val
 * @param {String} type
 * @api public
 */

function typecast (val, type) {
  var fn = typecast[type];
  if (typeof fn != 'function') throw new Error('cannot cast to ' + type);
  return fn(val);
}

/**
 * Cast `val` to `String`
 *
 * @param {Mixed} val
 * @api public
 */

typecast.string = function (val) {
  if (null == val) return '';
  return val.toString();
};

/**
 * Cast `val` to `Number`
 *
 * @param {Mixed} val
 * @api public
 */

typecast.number = function (val) {
  var num = parseFloat(val);
  return isNaN(num)
    ? 0
    : num;
};

/**
 * Cast `val` to a`Date`
 *
 * @param {Mixed} val
 * @api public
 */

typecast.date = function (val) {
  var date = new Date(val);
  return isNaN(date.valueOf())
    ? new Date(0)
    : date;
};

/**
 * Cast `val` to `Array`
 *
 * @param {Mixed} val
 * @api public
 */

typecast.array = function (val) {
  if (val == null) return [];
  if (val instanceof Array) return val;
  if (typeof val != 'string') return [val];

  var arr = val.split(',');
  for (var i = 0; i < arr.length; i++) {
    arr[i] = arr[i].trim();
  }

  return arr;
};

/**
 * Cast `val` to `Boolean`
 *
 * @param {Mixed} val
 * @api public
 */

typecast.boolean = function (val) {
  return !! val && val !== 'false' && val !== '0';
};
}, {}],
41: [function(require, module, exports) {
/**
 * Module dependencies
 */

var invalid = require('invalid');

/**
 * Export `Type`
 */

module.exports = Type;

/**
 * Initialize `Type`
 */

function Type(type) {
  return function(value) {
    var err = invalid(value, type);
    return err || value;
  }
}

}, {"invalid":48}],
48: [function(require, module, exports) {
/**
 * Type
 */

try {
  var type = require('type');
} catch (e) {
  var type = require('component-type');
}

/**
 * Export `invalid`
 */

module.exports = invalid;

/**
 * Initialize `invalid`
 *
 * @param {Mixed} obj
 * @param {Mixed} schema
 * @return {Boolean|TypeError}
 * @api public
 */

function invalid(obj, schema) {
  return 1 == arguments.length
    ? function (o) { return check(valid(o, obj)); }
    : check(valid(obj, schema));

  // pass the errors through
  function check(errs) {
    return errs.length
      ? new TypeError(errs.join(', '))
      : false
  }
}

/**
 * Cast the string
 */

var cast = {
  'undefined': undefined,
  'function': Function,
  'boolean': Boolean,
  'number': Number,
  'string': String,
  'regexp': RegExp,
  'object': Object,
  'array': Array,
  'date': Date,
  'null': null,
  'nan': NaN
};

/**
 * Get the type
 *
 * @param {Mixed} val
 * @return {String}
 */

function typecheck(val) {
  switch(val) {
    case undefined: return 'undefined';
    case Function: return 'function';
    case Boolean: return 'boolean';
    case Number: return 'number';
    case String: return 'string';
    case RegExp: return 'regexp';
    case Object: return 'object';
    case Array: return 'Array';
    case Date: return 'date';
    case null: return 'null';
    case NaN: return 'nan';
    default: return type(val);
  }
}

/**
 * Validate `actual` against `expected`
 *
 * @param {Mixed} actual
 * @param {Mixed} expected
 * @param {String} key (private)
 * @return {Array} errors
 * @api public
 */

function valid(actual, expected, key) {
  key = key || '';

  var et = type(expected);
  var t = type(actual);
  var errs = [];

  if ('object' == et && t == et) {
    for (var k in actual)
      errs = errs.concat(valid(actual[k], expected[k], key ? key + '.' + k : k));
  } else if ('array' == et && t == et) {
    for (var i = 0, v; v = actual[i]; i++)
      errs = errs.concat(valid(v, expected[0], key ? key + '[' + i + ']': i));
  } else if ('regexp' == et && expected instanceof RegExp) {
    !expected.test(actual) && errs.push(error(t, key, actual, expected));
  } else if (cast[t] != expected) {
    errs.push(error(t, key, actual, expected));
  }

  return errs;
}

/**
 * Format an error
 *
 * @param {String} type
 * @param {String} key (optional)
 * @param {Mixed} actual
 * @param {Mixed} expected
 * @return {String}
 * @api private
 */

function error(type, key, actual, expected) {
  var msg = key ? key + ': ' : '';
  if (expected instanceof RegExp) {
    msg += fmt(type, actual) + ' does not match regexp ' + expected;
  } else {
    msg += fmt(type, actual) + ' is not a ' + typecheck(expected);
  }
  return msg;
}

/**
 * Format based on type
 *
 * @param {String} type
 * @param {Mixed} actual
 * @return {String}
 * @api private
 */

function fmt(type, actual) {
  switch(type) {
    case 'string': return actual = '"' + actual + '"';
    case 'object': return JSON.stringify(actual);
    case 'undefined':
    case 'number':
    case 'null':
      return actual;
    case 'function':
      return actual.toString().replace(/\{[^\}]+/, '{ ... ');
    default:
      return actual.toString();
  }
}

}, {"type":27,"component-type":27}]}, {}, {"1":"Ive"})
