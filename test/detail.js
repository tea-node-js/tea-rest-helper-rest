const assert = require('assert');
const rest = require('tea-rest');
require('tea-rest-plugin-mysql')(rest);

const helper = require('../')(rest);

const next = () => {};

/* global describe it */
describe('tea-rest-helper-rest', () => {
  describe('validate argument', () => {
    it('hook is null', (done) => {
      assert.throws(() => {
        helper.detail();
      }, (err) => {
        const msg = 'Geted instance will hook on ctx.hooks[hook], so `hook` must be a string';
        return err instanceof Error && err.message === msg;
      });

      done();
    });

    it('hook type error', (done) => {
      assert.throws(() => {
        helper.detail({ hi: 'world' });
      }, (err) => {
        const msg = 'Geted instance will hook on ctx.hooks[hook], so `hook` must be a string';
        return err instanceof Error && err.message === msg;
      });

      done();
    });

    it('attrs type error', (done) => {
      assert.throws(() => {
        helper.detail('user', 'string');
      }, (err) => {
        const msg = 'Attach other data dict. key => value, value is ctx\'s path';
        return err instanceof Error && err.message === msg;
      });

      done();
    });

    it('attrs check error', (done) => {
      assert.throws(() => {
        helper.detail('user', { string: [] });
      }, (err) => {
        const msg = 'The attachs structure is key = > value, value must be a string';
        return err instanceof Error && err.message === msg;
      });

      done();
    });

    it('statusCode type error, String', (done) => {
      assert.throws(() => {
        helper.detail('user', null, 'hello');
      }, err => err instanceof Error && err.message === 'HTTP statusCode, defaultValue is 200');

      done();
    });

    it('statusCode type error, Array', (done) => {
      assert.throws(() => {
        helper.detail('user', null, ['hello']);
      }, err => err instanceof Error && err.message === 'HTTP statusCode, defaultValue is 200');

      done();
    });
  });

  describe('argument all right', () => {
    it('only hook', (done) => {
      const ctx = {
        hooks: {
          user: {
            id: 1,
            name: 'baiyu',
          },
        },
        params: {
        },
        res: {
          success: ({ data }) => {
            assert.deepEqual({
              id: 1,
              name: 'baiyu',
            }, data);
            done();
          },
        },
      };

      helper.detail('user')(ctx, next);
    });

    it('attachs statusCode = 201, allowAttrs = true', (done) => {
      const ctx = {
        hooks: {
          user: {
            id: 1,
            name: 'baiyu',
            age: 36,
          },
          address: '北京市昌平区',
        },
        params: {
          attrs: 'id,name,address',
        },
        res: {
          success: ({ statusCode, data }) => {
            assert.equal(201, statusCode);
            assert.deepEqual({
              id: 1,
              name: 'baiyu',
              address: '北京市昌平区',
            }, data);
            done();
          },
        },
      };

      const detail = helper.detail('user', { address: 'hooks.address' }, 201, true);
      detail(ctx, next);
    });


    it('data is array', (done) => {
      const ctx = {
        hooks: {
          users: [{
            id: 1,
            name: 'baiyu',
            age: 36,
          }],
          address: '北京市昌平区',
        },
        params: {
          attrs: 'id,name',
        },
        res: {
          success: ({ data }) => {
            assert.deepEqual([{
              id: 1,
              name: 'baiyu',
            }], data);
            done();
          },
        },
      };

      const detail = helper.detail('users', null, null, true);
      detail(ctx, next);
    });

    it('data exists JSON method', (done) => {
      const ctx = {
        hooks: {
          user: {
            toJSON() {
              return {
                id: 1,
                name: 'baiyu',
                age: 36,
              };
            },
          },
          address: '北京市昌平区',
        },
        params: {
          attrs: 'id,name',
        },
        res: {
          success: ({ data }) => {
            assert.deepEqual({
              id: 1,
              name: 'baiyu',
            }, data);
            done();
          },
        },
      };

      const detail = helper.detail('user', null, null, true);

      detail(ctx, next);
    });
  });
});
