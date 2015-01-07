
# ive

  Isomorphic validation. Validate your forms in the browser and the form data on the server using the same schemas.

## Installation

**Server:**

    npm install ive

**Browser (duo):**

    var Ive = require('ive');

**Browser (standalone):**

  - [ive.js](dist/ive.js)
  - [ive.min.js](dist/ive.min.js)

**Browser (browserify):**

  - accepting PRs

## Features

  - Node & browser support
  - Generator-friendly
  - Thoughtful form validation
  - Data cleansing, formatting & casting
  - Asynchronous & custom validation
  - Validate against partial schemas
  - Informative errors
  - Composable schemas

## Example

**user-schema.js**

```js
var ive = module.exports = Ive();

ive.attr('name')
  .type(String)
  .between(2, 30)
  .required(true);

ive.attr('phone')
  .assert(/^\d{10}$/)
  .format(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3')
  .required(true)

ive.attr('email')
  .type(String)
  .assert(/\w+\@\w+\.\w+/)
  .required(true);

ive.attr('age')
  .cast(Number)
  .between(18, 110)
  .required(true);
```

### Browser

**index.html**

```html
<form action="/create" method='post' class="create-user">
  <input type="text" name="name" placeholder="name">
  <input type="text" name="phone" placeholder="phone">
  <input type="text" name="email" placeholder="email">
  <input type="text" name="age" placeholder="age">
</form>
```

**index.js**

```js
var schema = require('./user-schema');
schema(document.querySelector('.create-user'));
// that's it. everything else is handled through form and input attributes
```

### Server

#### - Express

**server.js**

```js
var schema = require('./user-schema');

app.post('/users', function(req, res, next) {
  var body = req.body;

  // validate
  schema(body, function(err, obj) {
    if (err) return res.send(400, { error: err });
    user.create(obj, next);
  });
});
```

#### - Koa

**server.js**

```js
var schema = require('./user-schema');

app.use(_.post('/users', function *(next) {
  var body = this.request.body;

  // validate
  var obj = yield schema(body);
  yield user.create(obj);

  yield next;
}));
```

## API

### `Ive([attrs])`

Initialize an `Ive` instance with an optional set of `attrs`.

### `ive(obj|str, [fn])`

Validate `obj` against the schema, calling `fn` when the validation is complete. `fn` has the signature
`function(error, val) { ... }`. `val` is the new object that may be cleansed, formatted, and cast.

```js
var ive = Ive({
  name: rube().type(String),
  email: rube().assert(/@/).type(String),
  age: rube().cast(Number).type(Number)
});

ive({
  name: 'matt',
  email: 'matt@lapwinglabs.com',
  age: '25'
}, function(err, v) {
  assert(!err);
  assert('matt' == v.name);
  assert('matt@lapwinglabs.com' == v.email);
  assert(25 === v.age);
  done();
});
```

If you're working with generators you can omit `fn` and Ive will return a thunk:

```js
var ive = Ive({
  name: rube().type(String),
  email: rube().assert(/@/).type(String),
  age: rube().cast(Number).type(Number)
});

var val = yield ive({
  name: 'matt',
  email: 'matt@lapwinglabs.com',
  age: '25'
});
```

You can also choose to validate against certain properties. This is useful if you're making updates
to an existing document and you don't have all the properties:

```js
var ive = Ive({
  name: rube().type(String).required(true),
  email: rube().assert(/@/).type(String).required(true),
  age: rube().cast(Number).type(Number).required(true)
});

// only validate on name and email
var some = ive('name email');

some({
  name: 'matt',
  email: 'matt@lapwinglabs.com'
})(fn)
```

### `ive.attr(name|ive|obj, [rube])`

Add an attribute, ive instance, or object to `ive`. Optionally you may pass a `rube` instance as the key.

```js
ive.attr('name', rube().required(true).type(String));
```

If you just specify a name, ive returns a [rube](https://github.com/lapwinglabs/rube) instance.

```js
ive.attr('phone')
  .assert(/^\d{10}$/)
  .format(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3')
  .required(true)
```

Ive schemas are composable:

```js
var basic = Schema();

basic.attr('name')
  .type(String)
  .between(2, 30)
  .required(true);

basic.attr('email')
  .type(String)
  .assert(/\w+\@\w+\.\w+/)
  .required(true);

var admin = Schema(basic);

admin.attr('password')
  .type(String)
  .between(8, 10)
  .assert(/[0-9]/)
  .required(true);
```

## Differences to other libraries

### parsley.js

- Nice for simple form validation, but it's declarative nature tends to get verbose very quickly.
- No server-side support
- jQuery dependency

## TODO

  * Better support for different form elements (radio, checkbox, etc.)
  * Customize the error formatting based on the environment
  * Better support for nested attributes
  * Subclass the generic Error

## Test

  Server:

    make test

  Browser:

    make browser

## License

(The MIT License)

Copyright (c) 2014 Matthew Mueller &lt;matt@lapwinglabs.com&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
