const assert = require('assert');
const rest = require('tea-rest');
require('tea-rest-plugin-mysql')(rest);
const helper = require('../')(rest);

const next = () => {};

/* global describe it */
describe('tea-rest-helper-rest-save', () => {
  describe('Argument validate error', () => {
    it('hook argument type error', (done) => {
      assert.throws(() => {
        helper.save({});
      }, (err) => {
        const msg = 'Will modify instance hook on ctx.hooks[hook], so `hook` must be a string';
        return err instanceof Error && err.message === msg;
      });
      done();
    });
  });

  describe('All aguments validate passed', () => {
    it('normal changed', (done) => {
      const save = helper.save('user');

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

      save(ctx, next);
    });

    it('normal unchanged', (done) => {
      const save = helper.save('user');

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
      };

      save(ctx, next);
    });

    it('Has error when save', (done) => {
      const save = helper.save('user');

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
        res: {
          sequelizeIfError: (error) => {
            assert.ok(error instanceof Error);
            assert.equal('Hello world', error.message);
            done();
          },
        },
      };

      save(ctx, next);
    });
  });
});
