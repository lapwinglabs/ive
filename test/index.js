/**
 * Module Dependencies
 */

var assert = require('assert');
var Schema = require('../');
var rube = require('rube');

describe('Schema', function() {

  it('should validate schema', function(done) {
    var schema = Schema();

    schema.attr('name').type(String)
    schema.attr('email').type(String)
    schema.attr('age').cast(Number).type(Number);

    schema({
      name: 'matt',
      email: 'matt@lapwinglabs.com',
      age: '25'
    }, function(err, v) {
      assert(!err);
      assert('matt' == v.name);
      assert('matt@lapwinglabs.com' == v.email);
      assert(25 === v.age);
      done();
    })
  });

  it('should work by passing in an object', function(done) {
    var schema = Schema({
      name: rube().type(String),
      email: rube().assert(/@/).type(String),
      age: rube().cast(Number).type(Number)
    });

    schema({
      name: 'matt',
      email: 'matt@lapwinglabs.com',
      age: '25'
    }, function(err, v) {
      assert(!err);
      assert('matt' == v.name);
      assert('matt@lapwinglabs.com' == v.email);
      assert(25 === v.age);
      done();
    })
  });

  it('should support composing objects', function(done) {
    var name = Schema().attr('name', rube().type(String));
    var email = Schema().attr('email', rube().assert(/@/).type(String));
    var age = Schema().attr('age', rube().cast(Number).type(Number));

    var schema = Schema()
      .attr(name)
      .attr(email)
      .attr(age)

    schema({
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

  });

  it('should support passing objects through `schema.attr`', function(done) {
    var schema = Schema()
      .attr({
        name: rube().type(String),
        email: rube().assert(/@/).type(String),
        age: rube().cast(Number).type(Number)
      })

    schema({
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
  })

  it('should remove properties that arent part of the schema', function(done) {
    var schema = Schema();
    schema.attr('name').type(String)
    schema.attr('email').type(String)
    schema.attr('age').cast(Number).type(Number);

    schema({
      name: 'matt',
      email: 'matt@lapwinglabs.com',
      age: '25',
      pets: []
    }, function(err, v) {
      assert(!err);
      assert('matt' == v.name);
      assert('matt@lapwinglabs.com' == v.email);
      assert(25 === v.age);
      assert(v.pets == undefined);
      done();
    })
  })

  it('should error out on missing required properties', function(done) {
    var schema = Schema();
    schema.attr('name').type(String).required(true);
    schema.attr('email').type(String).required(true);
    schema.attr('age').cast(Number).type(Number).required(true);

    schema({ name: 'matt', email: 'lapwinglabs@gmail.com' }, function(err) {
      assert(err);
      assert(err.message.indexOf('age'));
      done();
    });
  })

  describe('validate certain fields', function() {
    it('should support space-separated strings', function(done) {
      var schema = Schema();
      schema.attr('name').type(String).required(true);
      schema.attr('email').type(String).required(true);
      schema.attr('age').cast(Number).type(Number).required(true);

      schema('name email', { name: 'matt', email: 'lapwinglabs@gmail.com' }, function(err, v) {
        assert(!err);
        assert('matt' == v.name);
        assert('lapwinglabs@gmail.com' == v.email);
        done();
      })
    })
  });

  it('ive should be composable', function(done) {
    var basic = Schema();

    basic.attr('name')
      .type(String)
      .between(2, 30)
      .required(true);

    basic.attr('email')
      .type(String)
      .assert(/\w+\@\w+\.\w+/)
      .required(true);

    var admin = Schema(basic)

    admin.attr('password')
      .type(String)
      .between(5, 10)
      .assert(/[0-9]/)
      .required(true);

    admin({
      name: 'matt',
      email: 'lapwinglabs@gmail.com',
      password: '0abcde'
    }, function(err, v) {
      assert(!err);
      assert('matt' == v.name);
      assert('lapwinglabs@gmail.com' == v.email);
      assert('0abcde' == v.password);
      done();
    });
  })
})
