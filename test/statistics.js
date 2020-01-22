const assert = require('assert');
const rest = require('tea-rest');
const om = require('tea-rest-plugin-mysql');

om(rest);
const { Sequelize } = rest;
const { Op } = Sequelize;
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

const next = () => {};

/* global describe it */
describe('open-rest-helper-rest-statistics', () => {
  describe('argument validate', () => {
    it('Model argument unset', (done) => {
      assert.throws(() => {
        helper.statistics();
      }, (err) => {
        const msg = 'Model must be a class of Sequelize defined';
        return err instanceof Error && err.message === msg;
      });
      done();
    });
    it('Model argument type error', (done) => {
      assert.throws(() => {
        helper.statistics({});
      }, (err) => {
        const msg = 'Model must be a class of Sequelize defined';
        return err instanceof Error && err.message === msg;
      });
      done();
    });

    it('opt argument type error', (done) => {
      assert.throws(() => {
        helper.statistics(Model, {});
      }, (err) => {
        const msg = "FindAll option condition, ctx's value path, so `where` must be a string";
        return err instanceof Error && err.message === msg;
      });
      done();
    });

    it('hook argument type error', (done) => {
      assert.throws(() => {
        helper.statistics(Model, 'opt', {});
      }, (err) => {
        const msg = [
          'Geted statistics data will hook on ctx.hooks[hook],',
          'so `hook` must be a string',
        ].join(' ');
        return err instanceof Error && err.message === msg;
      });
      done();
    });

    it('conf argument type error', (done) => {
      assert.throws(() => {
        helper.statistics(Model, 'opt', null, {});
      }, (err) => {
        const msg = 'Status dynamic config, ctx\'s value path';
        return err instanceof Error && err.message === msg;
      });
      done();
    });
  });
  describe('Argument validate pass', () => {
    it('normal', (done) => {
      const Model1 = sequelize.define('book', {
        id: {
          type: Sequelize.INTEGER.UNSIGNED,
          primaryKey: true,
          autoIncrement: true,
        },
        name: Sequelize.STRING,
      });

      Model1.includes = {
        creator: {
          model: Model1,
          as: 'creator',
          required: true,
        },
      };

      Model1.stats = {
        dimensions: {
          user: '`creatorId`',
        },
        metrics: {
          count: 'COUNT(*)',
        },
        pagination: {
          maxResults: 20,
          maxResultsLimit: 2000,
          maxStartIndex: 50000,
        },
      };

      Model1.findAll = (options) => {
        const expect = {
          attributes: [
            'Date(`createdAt`) AS `date`',
            '`creatorId` AS `user`',
            'COUNT(*) AS `count`',
          ],
          where: {
            [Op.and]: [
              { id: { [Op.gte]: 200 } },
              [
                "`isDelete`='no'",
                [
                  '',
                ],
              ],
            ],
          },
          group: [
            '`date`',
            '`user`',
          ],
          offset: 0,
          limit: 20,
          include: [{
            model: Model1,
            as: 'creator',
            required: true,
            attributes: [],
          }],
          raw: true,
        };

        assert.deepEqual(expect, options);

        return new Promise((resolve) => {
          setTimeout(() => {
            resolve([{
              date: '2016-04-15',
              user: '小不点',
              count: 100000000,
            }, {
              date: '2016-04-16',
              user: '赵思鸣',
              count: 100000000,
            }]);
          }, 50);
        });
      };

      Model1.findOne = (options) => {
        assert.deepEqual({
          where: {
            [Op.and]: [
              { id: { [Op.gte]: 200 } },
              [
                "`isDelete`='no'",
                [
                  '',
                ],
              ],
            ],
          },
          raw: true,
          include: [{
            model: Model1,
            as: 'creator',
            required: true,
            attributes: [],
          }],
          attributes: [
            'COUNT(DISTINCT Date(`createdAt`), `creatorId`) AS `count`',
          ],
        }, options);


        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({ count: 20 });
          }, 50);
        });
      };

      const ctx = {
        params: {
          dimensions: 'date,user',
          metrics: 'count',
          id_gte: 200,
          includes: 'creator',
        },
        hooks: {
          opt: {
            where: "`isDelete`='no'",
          },
          conf: {
            dimensions: {
              date: 'Date(`createdAt`)',
            },
          },
        },
        set: (field, val) => {
          assert.equal('X-Content-Record-Total', field);
          assert.equal(20, val);
        },
        res: {
          ok: ({ data }) => {
            assert.deepEqual([{
              date: '2016-04-15',
              user: '小不点',
              count: 100000000,
            }, {
              date: '2016-04-16',
              user: '赵思鸣',
              count: 100000000,
            }], data);
            done();
          },
          sequelizeIfError: (error) => {
            assert.ok(error instanceof Error);
            assert.equal('This is a test error message', error.message);
            done();
          },
        },
      };

      const statistics = helper.statistics(Model1, 'hooks.opt.where', null, 'hooks.conf');

      statistics(ctx, next);
    });

    it('set hook, chainning call', (done) => {
      const Model1 = sequelize.define('book', {
        id: {
          type: Sequelize.INTEGER.UNSIGNED,
          primaryKey: true,
          autoIncrement: true,
        },
        name: Sequelize.STRING,
      });
      Model1.includes = {
        creator: {
          model: Model1,
          as: 'creator',
          required: true,
        },
      };
      Model1.stats = {
        dimensions: {
          user: '`creatorId`',
        },
        metrics: {
          count: 'COUNT(*)',
        },
        pagination: {
          maxResults: 20,
          maxResultsLimit: 2000,
          maxStartIndex: 50000,
        },
      };
      Model1.findAll = (options) => {
        assert.deepEqual({
          attributes: [
            'Date(`createdAt`) AS `date`',
            '`creatorId` AS `user`',
            'COUNT(*) AS `count`',
          ],
          where: {
            [Op.and]: [
              { id: { [Op.gte]: 200 } },
              [
                "`isDelete`='no'",
                [
                  '',
                ],
              ],
            ],
          },
          group: [
            '`date`',
            '`user`',
          ],
          offset: 0,
          limit: 20,
          include: [{
            model: Model1,
            as: 'creator',
            required: true,
            attributes: [],
          }],
          raw: true,
        }, options);
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve([{
              date: '2016-04-15',
              user: '小不点',
              count: 100000000,
            }, {
              date: '2016-04-16',
              user: '赵思鸣',
              count: 100000000,
            }]);
          }, 50);
        });
      };
      Model1.findOne = (options) => {
        assert.deepEqual({
          where: {
            [Op.and]: [
              { id: { [Op.gte]: 200 } },
              [
                "`isDelete`='no'",
                [
                  '',
                ],
              ],
            ],
          },
          raw: true,
          include: [{
            model: Model1,
            as: 'creator',
            required: true,
            attributes: [],
          }],
          attributes: [
            'COUNT(DISTINCT Date(`createdAt`), `creatorId`) AS `count`',
          ],
        }, options);
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({ count: 20 });
          }, 50);
        });
      };
      const ctx = {
        params: {
          dimensions: 'date,user',
          metrics: 'count',
          id_gte: 200,
          includes: 'creator',
        },
        hooks: {
          opt: {
            where: "`isDelete`='no'",
          },
          conf: {
            dimensions: {
              date: 'Date(`createdAt`)',
            },
          },
        },
        set: (field, val) => {
          assert.equal('X-Content-Record-Total', field);
          assert.equal(20, val);
        },
      };

      const statistics = helper
        .statistics
        .Model(Model1)
        .where('hooks.opt.where')
        .hook('stats')
        .conf('hooks.conf')
        .exec();

      statistics(ctx, () => {
        assert.deepEqual([{
          date: '2016-04-15',
          user: '小不点',
          count: 100000000,
        }, {
          date: '2016-04-16',
          user: '赵思鸣',
          count: 100000000,
        }], ctx.hooks.stats);
        done();
      });
    });

    it('set hook, chainning call', (done) => {
      const Model1 = sequelize.define('book', {
        id: {
          type: Sequelize.INTEGER.UNSIGNED,
          primaryKey: true,
          autoIncrement: true,
        },
        name: Sequelize.STRING,
      });
      Model1.includes = {
        creator: {
          model: Model1,
          as: 'creator',
          required: true,
        },
      };
      Model1.stats = {
        dimensions: {
          user: '`creatorId`',
        },
        metrics: {
          count: 'COUNT(*)',
        },
        pagination: {
          maxResults: 20,
          maxResultsLimit: 2000,
          maxStartIndex: 50000,
        },
      };
      Model1.findAll = (options) => {
        assert.deepEqual({
          attributes: [
            'Date(`createdAt`) AS `date`',
            '`creatorId` AS `user`',
            'COUNT(*) AS `count`',
          ],
          where: {
            [Op.and]: [
              { id: { [Op.gte]: 200 } },
              [
                "`isDelete`='no'",
                [
                  '',
                ],
              ],
            ],
          },
          group: [
            '`date`',
            '`user`',
          ],
          offset: 0,
          limit: 20,
          include: [{
            model: Model1,
            as: 'creator',
            required: true,
            attributes: [],
          }],
          raw: true,
        }, options);
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve([{
              date: '2016-04-15',
              user: '小不点',
              count: 100000000,
            }, {
              date: '2016-04-16',
              user: '赵思鸣',
              count: 100000000,
            }]);
          }, 50);
        });
      };

      Model1.findOne = (options) => {
        assert.deepEqual({
          where: {
            [Op.and]: [
              { id: { [Op.gte]: 200 } },
              [
                "`isDelete`='no'",
                [
                  '',
                ],
              ],
            ],
          },
          raw: true,
          include: [{
            model: Model1,
            as: 'creator',
            required: true,
            attributes: [],
          }],
          attributes: [
            'COUNT(DISTINCT Date(`createdAt`), `creatorId`) AS `count`',
          ],
        }, options);
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({ count: 20 });
          }, 50);
        });
      };
      const ctx = {
        params: {
          dimensions: 'date,user',
          metrics: 'count',
          id_gte: 200,
          includes: 'creator',
        },
        hooks: {
          opt: {
            where: "`isDelete`='no'",
          },
          conf: {
            dimensions: {
              date: 'Date(`createdAt`)',
            },
          },
        },
        set: (field, val) => {
          assert.equal('X-Content-Record-Total', field);
          assert.equal(20, val);
        },
      };

      const statistics = helper
        .statistics
        .Model(Model1)
        .where('hooks.opt.where')
        .hook('stats')
        .conf('hooks.conf')
        .exec();
      statistics(ctx, () => {
        assert.deepEqual([{
          date: '2016-04-15',
          user: '小不点',
          count: 100000000,
        }, {
          date: '2016-04-16',
          user: '赵思鸣',
          count: 100000000,
        }], ctx.hooks.stats);
        done();
      });
    });

    it('happen error', (done) => {
      const Model1 = sequelize.define('book', {
        id: {
          type: Sequelize.INTEGER.UNSIGNED,
          primaryKey: true,
          autoIncrement: true,
        },
        name: Sequelize.STRING,
      });
      Model1.includes = {
        creator: {
          model: Model1,
          as: 'creator',
          required: true,
        },
      };
      Model1.stats = {
        dimensions: {
          user: '`creatorId`',
        },
        metrics: {
          count: 'COUNT(*)',
        },
        pagination: {
          maxResults: 20,
          maxResultsLimit: 2000,
          maxStartIndex: 50000,
        },
      };
      Model1.findAll = (options) => {
        assert.deepEqual({
          attributes: [
            '`creatorId` AS `user`',
            'COUNT(*) AS `count`',
          ],
          where: {
            [Op.and]: [
              { id: { [Op.gte]: 200 } },
            ],
          },
          group: [
            '`user`',
          ],
          offset: 0,
          limit: 20,
          include: [{
            model: Model1,
            as: 'creator',
            required: true,
            attributes: [],
          }],
          raw: true,
        }, options);
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            reject(Error('Hello world'));
          }, 50);
        });
      };

      Model1.findOne = (options) => {
        assert.deepEqual({
          where: {
            [Op.and]: [
              { id: { [Op.gte]: 200 } },
            ],
          },
          raw: true,
          include: [{
            model: Model1,
            as: 'creator',
            required: true,
            attributes: [],
          }],
          attributes: [
            'COUNT(DISTINCT `creatorId`) AS `count`',
          ],
        }, options);
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({ count: 20 });
          }, 50);
        });
      };
      const ctx = {
        params: {
          dimensions: 'user',
          metrics: 'count',
          id_gte: 200,
          includes: 'creator',
        },
        hooks: {},
        set: (field, val) => {
          assert.equal('X-Content-Record-Total', field);
          assert.equal(20, val);
        },
        res: {
          sequelizeIfError: (error) => {
            assert.ok(error instanceof Error);
            assert.equal('Hello world', error.message);
            done();
          },
        },
      };

      const statistics = helper
        .statistics
        .Model(Model1)
        .hook('stats')
        .exec();
      statistics(ctx, next);
    });
  });
});
