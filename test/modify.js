const assert = require('assert');
const rest = require('tea-rest');
const om = require('tea-rest-plugin-mysql');

om(rest);
const { Sequelize } = rest;
const helper = require('../')(rest);

const sequelize = new Sequelize();
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
describe('tea-rest-helper-rest-modify', () => {
  describe('Argument validate error', () => {
    it('Model argument unset', (done) => {
      assert.throws(() => {
        helper.modify();
      }, (err) => {
        const msg = 'Model must be a class of Sequelize defined';
        return err instanceof Error && err.message === msg;
      });
      done();
    });

    it('Model argument type error', (done) => {
      assert.throws(() => {
        helper.modify({});
      }, (err) => {
        const msg = 'Model must be a class of Sequelize defined';
        return err instanceof Error && err.message === msg;
      });
      done();
    });

    it('hook argument type error', (done) => {
      assert.throws(() => {
        helper.modify(Model, {});
      }, (err) => {
        const msg = 'Will modify instance hook on req.hooks[hook], so `hook` must be a string';
        return err instanceof Error && err.message === msg;
      });
      done();
    });

    it('cols type error', (done) => {
      assert.throws(() => {
        helper.modify(Model, 'user', 'string');
      }, err => err instanceof Error && err.message === "Allow modify attrs's name array");
      done();
    });

    it('cols item type error', (done) => {
      assert.throws(() => {
        helper.modify(Model, 'user', [null]);
      }, err => err instanceof Error && err.message === 'Every item in cols must be a string.');
      done();
    });

    it('cols item non-exists error', (done) => {
      assert.throws(() => {
        helper.modify(Model, 'user', ['id', 'price']);
      }, err => err instanceof Error && err.message === 'Attr non-exists: price');
      done();
    });
  });

  describe('All aguments validate passed', () => {
    it('normal changed', (done) => {
      const modify = helper.modify(Model, 'user', ['name']);

      const ctx = {
        hooks: {
          user: {
            id: 1,
            name: 'baiyu',
            age: 36,
            changed() {
              return ['name'];
            },
            save(option) {
              assert.deepEqual({
                fields: ['name'],
              }, option);
              return new Promise((resolve) => {
                setTimeout(() => {
                  resolve({
                    id: 1,
                    name: 'baiyu',
                    age: 36,
                  });
                }, 20);
              });
            },
          },
        },
        params: {
          id: 99,
          name: 'baiyu',
        },
        res: {
          ok: ({ data }) => {
            assert.deepEqual({
              id: 1,
              name: 'baiyu',
              age: 36,
            }, data);
            done();
          },
        },
      };

      modify(ctx, next);
    });

    it('normal unchanged', (done) => {
      const modify = helper.modify(Model, 'user');

      const header = {};

      const ctx = {
        hooks: {
          user: {
            id: 1,
            name: 'baiyu',
            age: 36,
            changed() {
              return false;
            },
          },
        },
        params: {
          id: 99,
          name: 'baiyu',
        },
        set: (field, val) => {
          assert.equal('X-Content-Resource-Status', field);
          assert.equal('Unchanged', val);
        },
        res: {
          ok: ({ data }) => {
            assert.equal(ctx.hooks.user, data);
            assert.equal(true, ctx._resourceNotChanged);
            done();
          },
        },
        header,
      };

      modify(ctx, next);
    });

    it('Has error when save', (done) => {
      const modify = helper.modify(Model, 'user');

      const ctx = {
        hooks: {
          user: {
            id: 1,
            name: 'baiyu',
            age: 36,
            changed() {
              return ['name'];
            },
            save(option) {
              assert.deepEqual({
                fields: ['name'],
              }, option);
              return new Promise((resolve, reject) => {
                setTimeout(() => {
                  reject(Error('Hello world'));
                }, 20);
              });
            },
          },
        },
        params: {
          id: 99,
          name: 'baiyu',
        },
        set: (field, val) => {
          assert.equal('X-Content-Resource-Status', field);
          assert.equal('Unchanged', val);
        },
        res: {
          sequelizeIfError: (error) => {
            assert.ok(error instanceof Error);
            assert.equal('Hello world', error.message);
            done();
          },
        },
      };

      modify(ctx, next);
    });

    it('Has error when beforeModify', (done) => {
      const modify = helper.modify(Model, 'user', ['name', 'age']);

      const ctx = {
        hooks: {
          user: {
            id: 1,
            name: 'baiyu',
            age: 36,
            changed() {
              return ['name'];
            },
            save() {
              return new Promise((resolve, reject) => {
                setTimeout(() => {
                  reject(new Error('Has error when save'));
                }, 10);
              });
            },
          },
        },
        set: (field, val) => {
          assert.equal('X-Content-Resource-Status', field);
          assert.equal('Unchanged', val);
        },
        res: {
          sequelizeIfError: (error) => {
            assert.ok(error instanceof Error);
            assert.equal('Has error when save', error.message);
            done();
          },
        },
      };

      modify(ctx, next);
    });
  });
});
