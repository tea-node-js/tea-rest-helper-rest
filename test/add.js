const assert = require('assert');
const rest = require('tea-rest');
const _ = require('lodash');
const om = require('tea-rest-plugin-mysql');

om(rest);
const { Sequelize } = rest;
const helper = require('../')(rest);

const sequelize = new Sequelize({
  dialect: 'mysql',
});
const Model = sequelize.define('book', {
  id: {
    type: Sequelize.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  name: Sequelize.STRING,
  age: Sequelize.INTEGER.UNSIGNED,
});

const next = () => {};

/* global describe it */
describe('tea-rest-helper-rest-add', () => {
  describe('Argument validate error', () => {
    it('Model argument unset', (done) => {
      assert.throws(() => {
        helper.add();
      }, err => (
        err instanceof Error && err.message === 'Model must be a class of Sequelize defined'
      ));
      done();
    });

    it('Model argument type error', (done) => {
      assert.throws(() => {
        helper.add({});
      }, err => (
        err instanceof Error && err.message === 'Model must be a class of Sequelize defined'
      ));
      done();
    });

    it('cols type error', (done) => {
      assert.throws(() => {
        helper.add(Model, 'string');
      }, err => err instanceof Error && err.message === "Allow writed attrs's name array");
      done();
    });

    it('cols item type error', (done) => {
      assert.throws(() => {
        helper.add(Model, [null]);
      }, err => err instanceof Error && err.message === 'Every item in cols must be a string.');
      done();
    });

    it('cols item non-exists error', (done) => {
      assert.throws(() => {
        helper.add(Model, ['id', 'price']);
      }, err => err instanceof Error && err.message === 'Attr non-exists: price');
      done();
    });

    it('hook argument type error', (done) => {
      assert.throws(() => {
        helper.add(Model, null, {});
      }, (err) => {
        const msg = 'Added instance will hook on ctx.hooks[hook], so `hook` must be a string';
        return err instanceof Error && err.message === msg;
      });
      done();
    });

    it('attrs type error', (done) => {
      assert.throws(() => {
        helper.add(Model, null, null, 'string');
      }, (err) => {
        const msg = 'Attach other data dict. key => value, value is ctx\'s path';
        return err instanceof Error && err.message === msg;
      });

      done();
    });

    it('attrs check error', (done) => {
      assert.throws(() => {
        helper.add(Model, null, null, { string: [] });
      }, (err) => {
        const msg = 'The attachs structure is key = > value, value must be a string';
        return err instanceof Error && err.message === msg;
      });

      done();
    });
  });

  describe('All aguments validate passed', () => {
    it('normal cols set, hook set', (done) => {
      const add = helper.add(Model, ['name', 'age'], 'user', { address: 'hooks.address' });

      const ctx = {
        hooks: {
          address: '北京市昌平区',
        },
        params: {
          id: 99,
          name: 'baiyu',
          age: 36,
        },
        res: {
          success: ({ statusCode, data }) => {
            assert.equal(201, statusCode);
            assert.deepEqual({
              id: 1,
              name: 'baiyu',
              age: 36,
              address: '北京市昌平区',
            }, data);
            done();
          },
        },
      };

      Model.build = attrs => (
        _.extend({}, attrs, {
          save() {
            return new Promise((resolve) => {
              setTimeout(() => {
                resolve(_.extend({}, attrs, {
                  id: 1,
                }));
              }, 10);
            });
          },
        })
      );

      add(ctx, next);
    });

    it('normal cols set, hook unset', (done) => {
      const add = helper.add(Model, ['name', 'age'], null, { address: 'hooks.address' });

      const ctx = {
        hooks: {
          address: '北京市昌平区',
        },
        params: {
          id: 99,
          name: 'baiyu',
          age: 36,
        },
        res: {
          success: ({ statusCode, data }) => {
            assert.equal(201, statusCode);
            assert.deepEqual({
              id: 1,
              name: 'baiyu',
              age: 36,
              address: '北京市昌平区',
            }, data);
            done();
          },
        },
      };

      Model.build = attrs => (
        _.extend({}, attrs, {
          save() {
            return new Promise((resolve) => {
              setTimeout(() => {
                resolve(_.extend({}, attrs, {
                  id: 1,
                }));
              }, 10);
            });
          },
        })
      );

      add(ctx, next);
    });

    it('Has error when beforeAdd', (done) => {
      const add = helper.add(Model, ['name', 'age'], null, { address: 'hooks.address' });

      const ctx = {
        hooks: {
          address: '北京市昌平区',
        },
        params: {
          id: 99,
          name: 'baiyu',
          age: 36,
        },
        res: {
          sequelizeIfError: (error) => {
            assert.ok(error instanceof Error);
            assert.equal('Hello world', error.message);
            done();
          },
        },
      };

      Model.build = attrs => (
        _.extend({}, attrs, {
          save() {
            return new Promise((resolve, reject) => {
              setTimeout(() => {
                reject(Error('Hello world'));
              }, 10);
            });
          },
        })
      );

      add(ctx, next);
    });
  });
});
