const assert = require('assert');
const rest = require('tea-rest');
const om = require('tea-rest-plugin-mysql');
const _ = require('lodash');

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

/* global describe it */
describe('tea-rest-helper-rest-beforeAdd', () => {
  describe('Argument validate error', () => {
    it('Model argument unset', (done) => {
      assert.throws(() => {
        helper.beforeAdd();
      }, (err) => {
        const msg = 'Model must be a class of Sequelize defined';
        return err instanceof Error && err.message === msg;
      });
      done();
    });

    it('Model argument type error', (done) => {
      assert.throws(() => {
        helper.beforeAdd({});
      }, (err) => {
        const msg = 'Model must be a class of Sequelize defined';
        return err instanceof Error && err.message === msg;
      });
      done();
    });

    it('cols type error', (done) => {
      assert.throws(() => {
        helper.beforeAdd(Model, 'string');
      }, err => err instanceof Error && err.message === "Allow writed attrs's name array");
      done();
    });

    it('cols item type error', (done) => {
      assert.throws(() => {
        helper.beforeAdd(Model, [null]);
      }, err => err instanceof Error && err.message === 'Every item in cols must be a string.');
      done();
    });

    it('cols item non-exists error', (done) => {
      assert.throws(() => {
        helper.beforeAdd(Model, ['id', 'price']);
      }, err => err instanceof Error && err.message === 'Attr non-exists: price');
      done();
    });
  });


  describe('All aguments validate passed', () => {
    it('normal cols set, hook set', (done) => {
      const beforeAdd = helper.beforeAdd(Model, ['name', 'age']);

      const ctx = {
        hooks: {},
        params: {
          id: 99,
          name: 'baiyu',
          age: 36,
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

      beforeAdd(ctx).then((mod) => {
        assert.deepEqual({
          id: 1,
          name: 'baiyu',
          age: 36,
        }, mod);

        done();
      });
    });

    it('normal cols unset, creatorId, clientIp', (done) => {
      const ctx = {
        hooks: {},
        params: {
          id: 99,
          name: 'baiyu',
          age: 36,
        },
        user: {
          id: 99999,
          name: '赵雄飞',
        },
        req: {
          ips: ['192.168.199.199'],
        },
      };

      const Model1 = sequelize.define('book', {
        id: {
          type: Sequelize.INTEGER.UNSIGNED,
          primaryKey: true,
          autoIncrement: true,
        },
        name: Sequelize.STRING,
        age: Sequelize.INTEGER.UNSIGNED,
        creatorId: Sequelize.INTEGER.UNSIGNED,
        clientIp: Sequelize.STRING,
      });

      const beforeAdd = helper.beforeAdd(Model1, null);

      Model1.writableCols = ['name', 'age'];

      Model1.build = attrs => (
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

      beforeAdd(ctx).then((mod) => {
        assert.deepEqual({
          id: 1,
          name: 'baiyu',
          age: 36,
          creatorId: 99999,
          clientIp: ['192.168.199.199'],
        }, mod);

        done();
      });
    });

    it('Has error when save', (done) => {
      const ctx = {
        hooks: {},
        params: {
          id: 99,
          name: 'baiyu',
          age: 36,
        },
        user: {
          id: 99999,
          name: '赵雄飞',
        },
        req: {
          ips: ['192.168.199.199'],
        },
      };

      const Model1 = sequelize.define('book', {
        id: {
          type: Sequelize.INTEGER.UNSIGNED,
          primaryKey: true,
          autoIncrement: true,
        },
        name: Sequelize.STRING,
        age: Sequelize.INTEGER.UNSIGNED,
        creatorId: Sequelize.INTEGER.UNSIGNED,
        clientIp: Sequelize.STRING,
      });

      const beforeAdd = helper.beforeAdd(Model1, null);

      Model1.writableCols = ['name', 'age'];

      Model1.build = attrs => (
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

      beforeAdd(ctx).catch((error) => {
        assert.ok(error instanceof Error);
        assert.equal('Hello world', error.message);
        done();
      });
    });

    it('set unique isDelete non-exists', (done) => {
      const ctx = {
        hooks: {},
        params: {
          id: 99,
          name: 'baiyu',
          email: '602316022@qq.com',
          age: 36,
        },
        user: {
          id: 99999,
          name: '赵雄飞',
        },
        req: {
          ips: ['192.168.199.199'],
        },
      };

      const Model1 = sequelize.define('book', {
        id: {
          type: Sequelize.INTEGER.UNSIGNED,
          primaryKey: true,
          autoIncrement: true,
        },
        name: Sequelize.STRING,
        email: Sequelize.STRING,
        age: Sequelize.INTEGER.UNSIGNED,
        creatorId: Sequelize.INTEGER.UNSIGNED,
        clientIp: Sequelize.STRING,
        isDelete: {
          type: Sequelize.ENUM,
          values: ['yes', 'no'],
        },
      });

      const beforeAdd = helper.beforeAdd(Model1, null);

      Model1.writableCols = ['name', 'age', 'email'];
      Model1.unique = ['name', 'email'];

      Model1.build = attrs => (
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

      Model1.findOne = (option) => {
        assert.deepEqual({
          name: 'baiyu',
          email: '602316022@qq.com',
        }, option.where);
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve();
          }, 10);
        });
      };

      beforeAdd(ctx).then((mod) => {
        assert.deepEqual({
          id: 1,
          name: 'baiyu',
          email: '602316022@qq.com',
          age: 36,
          creatorId: 99999,
          clientIp: ['192.168.199.199'],
        }, mod);

        done();
      });
    });

    it('set unique isDelete exists, isDelete=no', (done) => {
      const ctx = {
        hooks: {},
        params: {
          id: 99,
          name: 'baiyu',
          email: '602316022@qq.com',
          age: 36,
        },
        user: {
          id: 99999,
          name: '赵雄飞',
        },
        req: {
          ips: ['192.168.199.199'],
        },
      };

      const Model1 = sequelize.define('book', {
        id: {
          type: Sequelize.INTEGER.UNSIGNED,
          primaryKey: true,
          autoIncrement: true,
        },
        name: Sequelize.STRING,
        email: Sequelize.STRING,
        age: Sequelize.INTEGER.UNSIGNED,
        creatorId: Sequelize.INTEGER.UNSIGNED,
        clientIp: Sequelize.STRING,
        isDelete: {
          type: Sequelize.ENUM,
          values: ['yes', 'no'],
        },
      });

      const beforeAdd = helper.beforeAdd(Model1, null);

      Model1.writableCols = ['name', 'age', 'email'];
      Model1.unique = ['name', 'email'];

      Model1.build = attrs => _.extend({}, attrs, {});

      Model1.findOne = (option) => {
        assert.deepEqual({
          name: 'baiyu',
          email: '602316022@qq.com',
        }, option.where);
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              id: 1,
              name: 'baiyu',
              email: '602316022@qq.com',
              age: 35,
              creatorId: 99999,
              clientIp: '192.168.199.199',
              isDelete: 'no',
              save() {
                return new Promise((resol) => {
                  setTimeout(() => {
                    resol({
                      id: 1,
                      name: 'baiyu',
                      email: '602316022@qq.com',
                      age: 36,
                      creatorId: 99999,
                      clientIp: '192.168.199.199',
                      isDelete: 'no',
                    });
                  }, 10);
                });
              },
            });
          }, 10);
        });
      };

      beforeAdd(ctx).catch((error) => {
        assert.ok(error instanceof Error);
        assert.equal('Resource exists.', error.message);
        done();
      });
    });

    it('set unique isDelete exists, isDelete=yes', (done) => {
      const ctx = {
        hooks: {},
        params: {
          id: 99,
          name: 'baiyu',
          email: '602316022@qq.com',
          age: 36,
        },
        user: {
          id: 99999,
          name: '赵雄飞',
        },
        req: {
          ips: ['192.168.199.199'],
        },
      };

      const Model1 = sequelize.define('book', {
        id: {
          type: Sequelize.INTEGER.UNSIGNED,
          primaryKey: true,
          autoIncrement: true,
        },
        name: Sequelize.STRING,
        email: Sequelize.STRING,
        age: Sequelize.INTEGER.UNSIGNED,
        creatorId: Sequelize.INTEGER.UNSIGNED,
        clientIp: Sequelize.STRING,
        isDelete: {
          type: Sequelize.ENUM,
          values: ['yes', 'no'],
        },
      });

      const beforeAdd = helper.beforeAdd(Model1, null);

      Model1.writableCols = ['name', 'age', 'email'];
      Model1.unique = ['name', 'email'];

      Model1.build = attrs => (
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

      Model1.findOne = (option) => {
        assert.deepEqual({
          name: 'baiyu',
          email: '602316022@qq.com',
        }, option.where);
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              id: 1,
              name: 'baiyu',
              email: '602316022@qq.com',
              age: 36,
              creatorId: 99999,
              clientIp: '192.168.199.199',
              isDelete: 'yes',
              save() {
                return new Promise((resol) => {
                  setTimeout(() => {
                    resol({
                      id: 1,
                      name: 'baiyu',
                      email: '602316022@qq.com',
                      age: 36,
                      creatorId: 99999,
                      clientIp: '192.168.199.199',
                      isDelete: 'no',
                    });
                  }, 10);
                });
              },
            });
          }, 10);
        });
      };

      beforeAdd(ctx).then((mod) => {
        assert.deepEqual({
          id: 1,
          name: 'baiyu',
          email: '602316022@qq.com',
          age: 36,
          creatorId: 99999,
          isDelete: 'no',
          clientIp: '192.168.199.199',
        }, mod);
        done();
      });
    });
  });
});
