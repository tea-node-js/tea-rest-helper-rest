const assert = require('assert');
const rest = require('tea-rest');
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
});

/* global describe it */
describe('tea-rest-helper-rest-list', () => {
  describe('list', () => {
    it('Model argument type error', () => {
      assert.throws(() => {
        helper.list({});
      }, (err) => {
        const msg = 'Model must be a class of Sequelize defined';
        return err instanceof Error && err.message === msg;
      });
    });

    it('opt argument type error', () => {
      assert.throws(() => {
        helper.list(Model, {});
      }, (err) => {
        const msg = "FindAll option hooks's name, so `opt` must be a string";
        return err instanceof Error && err.message === msg;
      });
    });

    it('allowAttrs type error', () => {
      assert.throws(() => {
        helper.list(Model, null, 'string');
      }, err => err instanceof Error && err.message === 'Allow return attrs\'s name array');
    });

    it('allowAttrs item type error', () => {
      assert.throws(() => {
        helper.list(Model, null, [null]);
      }, (err) => {
        const msg = 'Every item in allowAttrs must be a string.';
        return err instanceof Error && err.message === msg;
      });
    });

    it('allowAttrs item non-exists error', () => {
      assert.throws(() => {
        helper.list(Model, null, ['price']);
      }, err => err instanceof Error && err.message === 'Attr non-exists: price');
    });

    it('All arguments validate pass', (done) => {
      const list = helper.list(Model);
      const headers = {};
      const ctx = {
        params: {
          id: 1,
        },
        set: (field, val) => {
          assert.equal('X-Content-Record-Total', field);
          assert.equal(2, val);
        },
        res: {
          ok: ({
            data = null,
          }) => {
            assert.deepEqual([], data);
            done();
          },
        },
        headers,
      };
      Model.findAll = () => (
        new Promise((resolve) => {
          setTimeout(() => {
            resolve([]);
          }, 100);
        })
      );
      Model.count = () => (
        new Promise((resolve) => {
          setTimeout(() => {
            resolve(2);
          }, 100);
        })
      );
      list(ctx);
    });

    it('count is 0', (done) => {
      const list = helper
        .list
        .Model(Model)
        .opt('opt')
        .allowAttrs(['id', 'name'])
        .hook('book')
        .exec();
      const ctx = {
        params: {
          id: 1,
          attrs: 'id',
        },
        hooks: {
          opt: {
            include: [{
              model: Model,
              as: 'creator',
              required: true,
            }],
          },
        },
        set: (field, val) => {
          assert.equal('X-Content-Record-Total', field);
          assert.equal(0, val);
        },
      };
      Model.findAll = () => (
        new Promise((resolve) => {
          setTimeout(() => {
            resolve([]);
          }, 100);
        })
      );
      Model.count = () => (
        new Promise((resolve) => {
          setTimeout(() => {
            resolve(0);
          }, 100);
        })
      );
      list(ctx, () => {
        assert.deepEqual([], ctx.hooks.book);
        done();
      });
    });

    it('count is 0, hook unset', (done) => {
      const list = helper
        .list
        .Model(Model)
        .opt('opt')
        .allowAttrs(['id', 'name'])
        .exec();
      const ctx = {
        params: {
          id: 1,
          attrs: 'id',
        },
        hooks: {
          opt: {
            include: [{
              model: Model,
              as: 'creator',
              required: true,
            }],
          },
        },
        set: (field, val) => {
          assert.equal('X-Content-Record-Total', field);
          assert.equal(0, val);
        },
        res: {
          ok: ({
            data = null,
          }) => {
            assert.deepEqual([], data);
            done();
          },
        },
      };
      Model.findAll = () => (
        new Promise((resolve) => {
          setTimeout(() => {
            resolve([]);
          }, 100);
        })
      );
      Model.count = () => (
        new Promise((resolve) => {
          setTimeout(() => {
            resolve(0);
          }, 100);
        })
      );
      list(ctx);
    });

    it('count is 2, hook unset', (done) => {
      const ls = [{
        id: 1,
        name: 'baiyu',
        email: '13740080@qq.com',
      }, {
        id: 2,
        name: 'StonePHP',
        email: '602316022@qq.com',
      }];
      const list = helper
        .list
        .Model(Model)
        .opt('opt')
        .allowAttrs(['id', 'name'])
        .exec();
      const ctx = {
        params: {
          id: 1,
          attrs: 'id',
        },
        hooks: {
          opt: {
            include: [{
              model: Model,
              as: 'creator',
              required: true,
            }],
          },
        },
        set: (field, val) => {
          assert.equal('X-Content-Record-Total', field);
          assert.equal(2, val);
        },
        res: {
          ok: ({
            data = null,
          }) => {
            assert.deepEqual([
              { id: 1 },
              { id: 2 },
            ], data);
            done();
          },
        },
      };
      Model.findAll = () => (
        new Promise((resolve) => {
          setTimeout(() => {
            resolve(ls);
          }, 100);
        })
      );
      Model.count = () => (
        new Promise((resolve) => {
          setTimeout(() => {
            resolve(2);
          }, 100);
        })
      );
      list(ctx);
    });

    it('count error', (done) => {
      const list = helper
        .list
        .Model(Model)
        .opt('opt')
        .allowAttrs(['id', 'name'])
        .exec();
      const ctx = {
        params: {
          id: 1,
          attrs: 'id',
        },
        hooks: {
          opt: {
            include: [{
              model: Model,
              as: 'creator',
              required: true,
            }],
          },
        },
        res: {
          sequelizeIfError: (error) => {
            assert.ok(error instanceof Error);
            assert.equal('Hello world', error.message);
            done();
          },
        },
      };
      Model.findAll = () => (
        new Promise((resolve) => {
          setTimeout(() => {
            resolve([]);
          }, 100);
        })
      );
      Model.count = () => (
        new Promise((resolve, reject) => {
          setTimeout(() => {
            reject(new Error('Hello world'));
          }, 100);
        })
      );
      list(ctx);
    });

    it('findAll error', (done) => {
      const list = helper
        .list
        .Model(Model)
        .opt('opt')
        .allowAttrs(['id', 'name'])
        .exec();
      const ctx = {
        params: {
          id: 1,
          attrs: 'id',
        },
        hooks: {
          opt: {
            include: [{
              model: Model,
              as: 'creator',
              required: true,
            }],
          },
        },
        res: {
          sequelizeIfError: (error) => {
            assert.ok(error instanceof Error);
            assert.equal('Hi world', error.message);
            done();
          },
        },
      };
      Model.findAll = () => (
        new Promise((resolve, reject) => {
          setTimeout(() => {
            reject(new Error('Hi world'));
          }, 100);
        })
      );
      Model.count = () => (
        new Promise((resolve) => {
          setTimeout(() => {
            resolve(2);
          }, 100);
        })
      );
      list(ctx);
    });
  });
});
