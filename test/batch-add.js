const assert = require('assert');
const rest = require('tea-rest');
const om = require('tea-rest-plugin-mysql');
const _ = require('lodash');
const helper = require('../')(rest);

om(rest);
const { Sequelize } = rest;
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

const validateSuccess = model => (
  () => (
    new Promise((resolve) => {
      setTimeout(() => {
        resolve(model);
      }, 10);
    })
  )
);

const validateFailure = () => (
  () => (
    new Promise((resolve, reject) => {
      setTimeout(() => {
        reject(Error('This is a test error message'));
      }, 10);
    })
  )
);

const next = () => {};

/* global describe it */
describe('open-rest-helper-rest-batchAdd', () => {
  describe('Argument validate error', () => {
    it('Model argument unset', (done) => {
      assert.throws(() => {
        helper.batchAdd();
      }, (err) => {
        const msg = 'Model must be a class of Sequelize defined';
        return err instanceof Error && err.message === msg;
      });
      done();
    });


    it('Model argument type error', (done) => {
      assert.throws(() => {
        helper.batchAdd({});
      }, err => (
        err instanceof Error && err.message === 'Model must be a class of Sequelize defined'
      ));
      done();
    });

    it('cols type error', (done) => {
      assert.throws(() => {
        helper.batchAdd(Model, 'string');
      }, err => err instanceof Error && err.message === "Allow writed attrs's name array");
      done();
    });

    it('cols item type error', (done) => {
      assert.throws(() => {
        helper.batchAdd(Model, [null]);
      }, err => err instanceof Error && err.message === 'Every item in cols must be a string.');
      done();
    });

    it('cols item non-exists error', (done) => {
      assert.throws(() => {
        helper.batchAdd(Model, ['id', 'price']);
      }, err => err instanceof Error && err.message === 'Attr non-exists: price');
      done();
    });

    it('hook argument type error', (done) => {
      assert.throws(() => {
        helper.batchAdd(Model, null, {});
      }, (err) => {
        const msg = 'Added instance will hook on ctx.hooks[hook], so `hook` must be a string';
        return err instanceof Error && err.message === msg;
      });
      done();
    });

    it('attrs type error', (done) => {
      assert.throws(() => {
        helper.batchAdd(Model, null, null, 'string');
      }, (err) => {
        const msg = 'Attach other data dict. key => value, value is ctx\'s path';
        return err instanceof Error && err.message === msg;
      });

      done();
    });

    it('attrs check error', (done) => {
      assert.throws(() => {
        helper.batchAdd(Model, null, null, { string: [] });
      }, (err) => {
        const msg = 'The attachs structure is key = > value, value must be a string';
        return err instanceof Error && err.message === msg;
      });

      done();
    });
  });

  describe('All aguments validate passed', () => {
    it('normal cols set, hook set, body is array', (done) => {
      const add = helper.batchAdd(Model, ['name', 'age'], 'user', { address: 'hooks.address' });

      const ctx = {
        hooks: {
          address: '北京市昌平区',
        },
        params: {},
        request: {
          body: [{
            id: 99,
            name: 'baiyu',
            age: 36,
          }],
        },
        res: {
          noContent: (data) => {
            assert.equal(null, data);
            done();
          },
        },
      };

      Model.build = (attrs) => {
        const model = _.extend({}, attrs, {
          reload() {
            return new Promise((resolve) => {
              setTimeout(() => {
                resolve(model);
              }, 10);
            });
          },
        });

        model.validate = validateSuccess(model);

        return model;
      };

      Model.bulkCreate = ls => (
        new Promise((resolve) => {
          setTimeout(() => {
            resolve(_.map(ls, (x, i) => {
              x.id = i + 1;
              return x;
            }));
          }, 10);
        })
      );

      add(ctx, next);
    });

    it('normal cols set, hook set, body isnot array, attachs', (done) => {
      const add = helper.batchAdd(Model, ['name', 'age'], 'user', { address: 'hooks.address' });

      const ctx = {
        hooks: {
          address: '北京市昌平区',
        },
        params: {},
        request: {
          body: {
            id: 99,
            name: 'baiyu',
            age: 36,
          },
        },
        res: {
          created: ({ data }) => {
            assert.deepEqual({
              id: 1,
              name: 'baiyu',
              age: 36,
              address: '北京市昌平区',
            }, _.pick(data, ['id', 'name', 'age', 'address']));
            done();
          },
        },
      };

      Model.build = (attrs) => {
        const model = _.extend({}, attrs, {
          reload() {
            return new Promise((resolve) => {
              setTimeout(() => {
                resolve(model);
              }, 10);
            });
          },
        });

        model.validate = validateSuccess(model);

        return model;
      };


      Model.create = x => (
        new Promise((resolve) => {
          setTimeout(() => {
            x.id = 1;
            resolve(x);
          }, 10);
        })
      );

      add(ctx, next);
    });

    it('normal cols set, hook set, body isnot array, no attachs', (done) => {
      const add = helper.batchAdd(Model, ['name', 'age'], 'user');

      const ctx = {
        hooks: {
          address: '北京市昌平区',
        },
        params: {},
        request: {
          body: {
            id: 99,
            name: 'baiyu',
            age: 36,
          },
        },
        res: {
          created: ({ data }) => {
            assert.deepEqual({
              id: 1,
              name: 'baiyu',
              age: 36,
            }, _.pick(data, ['id', 'name', 'age', 'address']));
            done();
          },
        },
      };

      add(ctx, next);
    });

    it('writableCols, creatorId, clientIp, validate failure', (done) => {
      Model.writableCols = ['name', 'age', 'address'];
      Model.rawAttributes.creatorId = {};
      Model.rawAttributes.clientIp = {};

      const add = helper.batchAdd(Model);

      const ctx = {
        user: {
          id: 3,
        },
        req: {
          ips: ['192.168.199.199'],
        },
        hooks: {
          address: '北京市昌平区',
        },
        params: {},
        request: {
          body: {
            id: 99,
            name: 'baiyu',
            age: 36,
          },
        },
        res: {
          sequelizeIfError: (error) => {
            assert.ok(error instanceof Error);
            assert.equal('This is a test error message', error.message);
            done();
          },
        },
      };

      Model.build = (attrs) => {
        const model = _.extend({}, attrs, {
          reload() {
            return new Promise((resolve) => {
              setTimeout(() => {
                resolve(model);
              }, 10);
            });
          },
        });

        model.validate = validateFailure(model);

        return model;
      };

      add(ctx, next);
    });

    it('writableCols, creatorId, clientIp, validate success, model.toJSON', (done) => {
      Model.writableCols = ['name', 'age', 'address'];
      Model.rawAttributes.creatorId = {};
      Model.rawAttributes.clientIp = {};

      const add = helper.batchAdd(Model);

      const ctx = {
        user: {
          id: 3,
        },
        req: {
          ips: ['192.168.199.188'],
        },
        hooks: {
          address: '北京市昌平区',
        },
        params: {},
        request: {
          body: {
            id: 99,
            name: 'baiyu',
            age: 36,
          },
        },
        res: {
          created: ({ data }) => {
            assert.deepEqual({
              id: 1,
              name: 'baiyu',
              age: 36,
              clientIp: ['192.168.199.188'],
              creatorId: 3,
            }, _.pick(data, ['id', 'name', 'age', 'address', 'clientIp', 'creatorId']));
            done();
          },
        },
      };

      Model.build = (attrs) => {
        const model = _.extend({}, attrs, {
          reload() {
            return new Promise((resolve) => {
              setTimeout(() => {
                resolve(model);
              }, 10);
            });
          },
        });
        model.validate = validateSuccess(model);

        model.toJSON = () => model;

        return model;
      };

      add(ctx, next);
    });

    it('writableCols, creatorId, clientIp, validate success, reload error', (done) => {
      Model.writableCols = ['name', 'age', 'address'];
      Model.rawAttributes.creatorId = {};
      Model.rawAttributes.clientIp = {};

      const add = helper.batchAdd(Model);

      const ctx = {
        user: {
          id: 3,
        },
        req: {
          ips: ['192.168.199.188'],
        },
        hooks: {
          address: '北京市昌平区',
        },
        params: {},
        request: {
          body: {
            id: 99,
            name: 'baiyu',
            age: 36,
          },
        },
        res: {
          sequelizeIfError: (error) => {
            assert.ok(error instanceof Error);
            assert.equal('Happen a error when reload', error.message);
            done();
          },
        },
      };

      Model.build = (attrs) => {
        const model = _.extend({}, attrs, {
          reload() {
            return new Promise((resolve, reject) => {
              setTimeout(() => {
                reject(Error('Happen a error when reload'));
              }, 10);
            });
          },
        });
        model.validate = validateSuccess(model);

        return model;
      };

      add(ctx, next);
    });

    it('writableCols, creatorId, clientIp, validate success, save error', (done) => {
      Model.writableCols = ['name', 'age', 'address'];
      Model.rawAttributes.creatorId = {};
      Model.rawAttributes.clientIp = {};

      const add = helper.batchAdd(Model);

      const ctx = {
        user: {
          id: 3,
        },
        req: {
          ips: ['192.168.199.188'],
        },
        hooks: {
          address: '北京市昌平区',
        },
        params: {},
        request: {
          body: {
            id: 99,
            name: 'baiyu',
            age: 36,
          },
        },
        res: {
          sequelizeIfError: (error) => {
            assert.ok(error instanceof Error);
            assert.equal('Happen a error when save', error.message);
            done();
          },
        },
      };

      Model.build = (attrs) => {
        const model = _.extend({}, attrs, {
          reload() {
            return new Promise((resolve) => {
              setTimeout(() => {
                resolve(model);
              }, 10);
            });
          },
        });
        model.validate = validateSuccess(model);

        return model;
      };

      Model.create = () => (
        new Promise((resolve, reject) => {
          setTimeout(() => {
            reject(Error('Happen a error when save'));
          }, 10);
        })
      );

      add(ctx, next);
    });
  });
});
