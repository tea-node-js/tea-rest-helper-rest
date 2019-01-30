const assert = require('assert');
const rest = require('tea-rest');
const om = require('tea-rest-plugin-mysql');

om(rest);
const helper = require('../')(rest);

const next = () => {};

/* global describe it */
describe('tea-rest-helper-rest-remove', () => {
  describe('Argument check', () => {
    it('hook argument type error', (done) => {
      assert.throws(() => {
        helper.remove.hook([]).exec();
      }, (error) => {
        const msg = 'Remove instance hook on req.hooks[hook], so `hook` must be a string';
        return error instanceof Error && error.message === msg;
      });

      done();
    });
  });

  describe('Argument all right', () => {
    it('isDelete non-exists', (done) => {
      const model = {
        destroy() {
          return new Promise((resolve) => {
            setTimeout(() => {
              resolve();
            }, 100);
          });
        },
      };

      const ctx = {
        hooks: {
          user: model,
        },
        res: {
          noContent: (data) => {
            assert.equal(null, data);
            done();
          },
        },
      };

      helper.remove('user')(ctx, next);
    });

    it('isDelete exists', (done) => {
      const model = {
        isDelete: 'no',
        save() {
          return new Promise((resolve) => {
            setTimeout(() => {
              resolve();
            }, 100);
          });
        },
      };

      const ctx = {
        hooks: {
          user: model,
        },
        user: {
          id: 5,
        },
        res: {
          noContent: (data) => {
            assert.equal(null, data);
            done();
          },
        },
      };


      helper.remove('user')(ctx, next);
    });

    it('only save isDelete when delete process', (done) => {
      const model = {
        isDelete: 'no',
        save(opts) {
          assert.deepEqual(opts, {
            fields: ['isDelete', 'deletorId', 'deletedAt'],
            validate: false,
          });
          return new Promise((resolve) => {
            setTimeout(() => {
              resolve();
            }, 100);
          });
        },
      };

      const ctx = {
        hooks: {
          user: model,
        },
        user: {
          id: 35,
        },
        res: {
          noContent: (data) => {
            assert.equal(null, data);
            done();
          },
        },
      };

      helper.remove('user')(ctx, next);
    });
  });
});
