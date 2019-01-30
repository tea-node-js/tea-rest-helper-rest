const assert = require('assert');
const rest = require('tea-rest');
require('tea-rest-plugin-mysql')(rest);

const { Sequelize } = rest;
const stats = require('../lib/stats')(rest);

const sequelize = new Sequelize();

/* global describe it */
describe('stats', () => {
  describe('metrics', () => {
    it('动态的指标配置', () => {
      const Model = {
        stats: {
          dimensions: {
            date: '`date2`',
          },
          metrics: {},
        },
      };
      const params = { metrics: 'count,total' };
      const _mets = {
        count: 'COUNT(*)',
        total: 'SUM(`price`)',
      };

      const expected = [
        'COUNT(*) AS `count`',
        'SUM(`price`) AS `total`',
      ];

      assert.deepEqual(expected, stats.metrics(Model, params, _mets));
    });
    it('isnt string', () => {
      const Model = {
        stats: {
          dimensions: {
            date: '`date2`',
          },
        },
      };
      const params = { metrics: [] };
      assert.throws(() => stats.metrics(Model, params), Error);
    });
    it('no', () => {
      const Model = {
        stats: {
          dimensions: {
            date: '`date2`',
          },
        },
      };
      const params = {};
      assert.throws(() => stats.metrics(Model, params), Error);
    });
    it('single', () => {
      const Model = {
        stats: {
          metrics: {
            count: 'count(*)',
            total: 'SUM(`num`)',
          },
        },
      };
      const params = {
        metrics: 'total',
      };
      const expected = ['SUM(`num`) AS `total`'];
      assert.deepEqual(stats.metrics(Model, params), expected);
    });
    it('multi', () => {
      const Model = {
        stats: {
          metrics: {
            count: 'count(*)',
            total: 'SUM(`num`)',
          },
        },
      };
      const params = {
        metrics: 'count,total',
      };
      const expected = ['count(*) AS `count`', 'SUM(`num`) AS `total`'];
      assert.deepEqual(stats.metrics(Model, params), expected);
    });
    return it('non-allowd', () => {
      const Model = {
        stats: {
          metrics: {
            count: 'count(*)',
            total: 'SUM(`num`)',
          },
        },
      };
      const params = {
        metrics: 'avg',
      };
      assert.throws(() => stats.metrics(Model, params), Error);
    });
  });

  describe('group', () => {
    it('dims unset', () => {
      assert.equal(undefined, stats.group());
      assert.equal(undefined, stats.group(0));
      assert.equal(undefined, stats.group(''));
      assert.equal(undefined, stats.group(undefined));
      assert.equal(undefined, stats.group(null));
    });

    it('dims isnt an array', () => {
      assert.equal(undefined, stats.group({}));
      assert.equal(undefined, stats.group(() => {}));
      assert.equal(undefined, stats.group(200));
      assert.equal(undefined, stats.group('hello'));
    });

    it('dims is an empty array', () => {
      assert.equal(undefined, stats.group([]));
    });

    it('dims is an array', () => {
      const dims = [
        '`creatorId` AS `user`',
        '`createdAt` AS `date`',
      ];
      assert.deepEqual(['`user`', '`date`'], stats.group(dims));
    });
  });

  describe('dimension', () => {
    it('动态维度处理', () => {
      const Model = {
        stats: {
          dimensions: {
            date: '`date2`',
          },
        },
      };
      const _dims = {
        user: '`creatorId`',
      };
      const params = { dimensions: 'user' };
      const expected = ['`creatorId` AS `user`'];
      assert.deepEqual(stats.dimensions(Model, params, _dims), expected);
    });
    it('isnt string', () => {
      const Model = {
        stats: {
          dimensions: {
            date: '`date2`',
          },
        },
      };
      const params = { dimensions: [] };
      assert.throws(() => {
        stats.dimensions(Model, params);
      }, err => err instanceof Error && err.message === 'Dimensions must be a string');
    });
    it('no', () => {
      const Model = {
        stats: {
          dimensions: {
            date: '`date2`',
          },
        },
      };
      const params = {};
      const expected = undefined;
      assert.equal(stats.dimensions(Model, params), expected);
    });
    it('single', () => {
      const Model = {
        stats: {
          dimensions: {
            date: '`date2`',
          },
        },
      };
      const params = {
        dimensions: 'date',
      };
      const expected = ['`date2` AS `date`'];
      assert.deepEqual(stats.dimensions(Model, params), expected);
    });
    it('multi', () => {
      const Model = {
        stats: {
          dimensions: {
            date: '`date2`',
            network: '3 + 2',
          },
        },
      };
      const params = {
        dimensions: 'date,network',
      };
      const expected = ['`date2` AS `date`', '3 + 2 AS `network`'];
      assert.deepEqual(stats.dimensions(Model, params), expected);
    });
    return it('non-allowd', () => {
      const Model = {
        stats: {
          dimensions: {
            date: '`date2`',
            network: '3 + 2',
          },
        },
      };
      const params = {
        dimensions: 'date,network,name',
      };
      assert.throws(() => stats.dimensions(Model, params), Error);
    });
  });

  describe('filters', () => {
    it('动态维度', () => {
      const Model = {
        rawAttributes: {},
        stats: {
          dimensions: {
            date: '`date2`',
          },
        },
      };
      const params = { filters: 'user==2' };
      const _dims = {
        user: '`creatorId`',
      };
      const expected = [
        {
          $or: [['`creatorId`=?', ['2']]],
        },
      ];
      assert.deepEqual(expected, stats.filters(Model, params.filters, _dims));
    });
    it('动态维度 onlyCols = true', () => {
      const Model = {
        rawAttributes: {},
        stats: {
          dimensions: {
            date: '`date2`',
          },
        },
      };
      const params = { filters: 'user==2' };
      const _dims = {
        user: '`creatorId`',
      };
      const expected = ['user'];
      assert.deepEqual(expected, stats.filters(Model, params.filters, _dims, true));
    });
    it('isnt a string', () => {
      const Model = {
        rawAttributes: {},
        stats: {
          dimensions: {
            date: '`date2`',
          },
        },
      };
      const params = { filters: [] };
      assert.throws(() => {
        stats.filters(Model, params.filters);
      }, err => err instanceof Error && err.message === 'Filters must be a string');
    });
    it('no', () => {
      const Model = {
        rawAttributes: {},
        stats: {
          dimensions: {
            date: '`date2`',
          },
        },
      };
      const params = {};
      const expected = [];
      assert.deepEqual(stats.filters(Model, params.filters), expected);
    });
    it('include isDelete column', () => {
      const Model = {
        rawAttributes: {
          isDelete: {},
        },
        stats: {
          dimensions: {
            date: '`date2`',
          },
        },
      };
      const params = {};
      const expected = [];
      assert.deepEqual(stats.filters(Model, params.filters), expected);
    });
    it('single', () => {
      const Model = {
        rawAttributes: {},
        stats: {
          dimensions: {
            date: '`date2`',
          },
        },
      };
      const filters = 'date==2014';
      const expected = [
        {
          $or: [['`date2`=?', ['2014']]],
        },
      ];
      assert.deepEqual(stats.filters(Model, filters), expected);
    });
    it('multi', () => {
      const Model = {
        rawAttributes: {
          networkId: {},
        },
        stats: {
          dimensions: {
            date: '`date2`',
            network: '3 + 2',
          },
        },
      };
      const filters = 'date==2014;networkId==11';
      const expected = [
        {
          $or: [['`date2`=?', ['2014']]],
        }, {
          $or: [['`networkId`=?', ['11']]],
        },
      ];
      assert.deepEqual(stats.filters(Model, filters), expected);
      assert.deepEqual(stats.filters(Model, filters, null, true), ['date', 'networkId']);
    });
    it('non-allowd', () => {
      const Model = {
        rawAttributes: {
          networkId: {},
        },
        stats: {
          dimensions: {
            date: '`date2`',
            network: '3 + 2',
          },
        },
      };
      const filters = 'date==2014;networkId==11;name=niubi';
      assert.throws(() => stats.filters(Model, filters), Error);
    });
    it('need escape', () => {
      const Model = {
        rawAttributes: {
          networkId: {},
        },
        stats: {
          dimensions: {
            date: '`date2`',
            network: '3 + 2',
          },
        },
      };
      const filters = "date==2014';networkId==11";
      const expected = [
        {
          $or: [['`date2`=?', ["2014'"]]],
        }, {
          $or: [['`networkId`=?', ['11']]],
        },
      ];
      assert.deepEqual(stats.filters(Model, filters), expected);
    });
    return it('no simple', () => {
      const Model = {
        rawAttributes: {
          networkId: {},
        },
        stats: {
          dimensions: {
            date: '`date2`',
            network: '3 + 2',
          },
        },
      };
      const filters = 'date==2014,date==2015;networkId==11,networkId==23';
      const expected = [
        {
          $or: [['`date2`=?', ['2014']], ['`date2`=?', ['2015']]],
        }, {
          $or: [['`networkId`=?', ['11']], ['`networkId`=?', ['23']]],
        },
      ];
      assert.deepEqual(stats.filters(Model, filters), expected);
    });
  });

  describe('sort', () => {
    it('no set', () => {
      const params = {
        dimensions: 'date,network,creator',
        metrics: 'count,avg,total',
      };
      const expected = undefined;
      assert.equal(stats.sort({}, params), expected);
    });
    it('desc', () => {
      const params = {
        dimensions: 'date,network,creator',
        metrics: 'count,avg,total',
        sort: '-count',
      };
      const expected = 'count DESC';
      assert.equal(stats.sort({}, params), expected);
    });
    it('asc', () => {
      const params = {
        dimensions: 'date,network,creator',
        metrics: 'count,avg,total',
        sort: 'count',
      };
      const expected = 'count ASC';
      assert.equal(stats.sort({}, params), expected);
    });
    it('params.dimensions isnt a string', () => {
      const params = {
        dimensions: ['date,network,creator'],
        metrics: 'count,avg,total',
        sort: 'count',
      };
      const expected = 'count ASC';
      assert.equal(stats.sort({}, params), expected);
    });
    it('sort dont allowd', () => {
      const params = {
        dimensions: ['date,network,creator'],
        sort: 'count',
      };
      const expected = undefined;
      assert.equal(stats.sort({}, params), expected);
    });
  });

  describe('pageParams', () => {
    it('default no set', () => {
      const Model = {
        stats: {},
      };
      const params = {};
      const expected = {
        offset: 0,
        limit: 10,
      };
      assert.deepEqual(stats.pageParams(Model, params), expected);
    });
    it('noraml page', () => {
      const Model = {
        stats: {},
      };
      const params = {
        startIndex: 20,
        maxResults: 15,
      };
      const expected = {
        offset: 20,
        limit: 15,
      };
      assert.deepEqual(stats.pageParams(Model, params), expected);
    });
    it('set pagination default', () => {
      const Model = {
        stats: {
          pagination: {
            maxResults: 20,
            maxResultsLimit: 2000,
            maxStartIndex: 50000,
          },
        },
      };
      const params = {};
      const expected = {
        offset: 0,
        limit: 20,
      };
      assert.deepEqual(stats.pageParams(Model, params), expected);
    });
    it('set pagination default page', () => {
      const Model = {
        stats: {
          pagination: {
            maxResults: 20,
            maxResultsLimit: 2000,
            maxStartIndex: 50000,
          },
        },
      };
      const params = {
        startIndex: 50,
      };
      const expected = {
        offset: 50,
        limit: 20,
      };
      assert.deepEqual(stats.pageParams(Model, params), expected);
    });
    it('set pagination limit startIndex', () => {
      const Model = {
        stats: {
          pagination: {
            maxResults: 20,
            maxResultsLimit: 2000,
            maxStartIndex: 50000,
          },
        },
      };
      const params = {
        startIndex: 5000000,
      };
      const expected = {
        offset: 50000,
        limit: 20,
      };
      assert.deepEqual(stats.pageParams(Model, params), expected);
    });
    it('set pagination limit maxResults', () => {
      const Model = {
        stats: {
          pagination: {
            maxResults: 20,
            maxResultsLimit: 2000,
            maxStartIndex: 50000,
          },
        },
      };
      const params = {
        startIndex: 5000000,
        maxResults: 10000,
      };
      const expected = {
        offset: 50000,
        limit: 2000,
      };
      assert.deepEqual(stats.pageParams(Model, params), expected);
    });
    it('set pagination lt 0', () => {
      const Model = {
        stats: {
          pagination: {
            maxResults: 20,
            maxResultsLimit: 2000,
            maxStartIndex: 50000,
          },
        },
      };
      const params = {
        startIndex: -1,
        maxResults: -10,
      };
      const expected = {
        offset: 0,
        limit: 0,
      };
      assert.deepEqual(stats.pageParams(Model, params), expected);
    });
  });

  describe('statsCount', () => {
    it('dims unset', () => {
      const Model = {
        stats: {
          pagination: {
            maxResults: 20,
            maxResultsLimit: 2000,
            maxStartIndex: 50000,
          },
        },
      };
      stats.statsCount(Model, {}, null, (error, count) => {
        assert.equal(null, error);
        assert.equal(1, count);
      });
    });

    it('dims empty array', (done) => {
      const Model = {
        stats: {
          pagination: {
            maxResults: 20,
            maxResultsLimit: 2000,
            maxStartIndex: 50000,
          },
        },
      };
      stats.statsCount(Model, {}, []).then((count) => {
        assert.equal(1, count);
        done();
      });
    });

    it('noraml', (done) => {
      const Model = {
        stats: {
          pagination: {
            maxResults: 20,
            maxResultsLimit: 2000,
            maxStartIndex: 50000,
          },
        },
        findOne(options) {
          assert.deepEqual({
            raw: true,
            include: [{
              model: Model,
              as: 'creator',
              required: true,
            }],
            attributes: [
              'COUNT(DISTINCT `creatorId`, DATE(`createdAt`)) AS `count`',
            ],
          }, options);
          return new Promise((resolve) => {
            setTimeout(() => {
              resolve({ count: 20 });
            }, 50);
          });
        },
      };
      const opt = {
        include: [{
          model: Model,
          as: 'creator',
          required: true,
        }],
      };
      const dims = [
        '`creatorId` AS `user`',
        'DATE(`createdAt`) AS `date`',
      ];
      stats.statsCount(Model, opt, dims).then((count) => {
        assert.equal(20, count);
        done();
      });
    });

    it('noraml opt.include unset', (done) => {
      const Model = {
        stats: {
          pagination: {
            maxResults: 20,
            maxResultsLimit: 2000,
            maxStartIndex: 50000,
          },
        },
        findOne(options) {
          assert.deepEqual({
            raw: true,
            attributes: [
              'COUNT(DISTINCT `creatorId`, DATE(`createdAt`)) AS `count`',
            ],
          }, options);
          return new Promise((resolve) => {
            setTimeout(() => {
              resolve({ count: 20 });
            }, 50);
          });
        },
      };
      const opt = {};
      const dims = [
        '`creatorId` AS `user`',
        'DATE(`createdAt`) AS `date`',
      ];
      stats.statsCount(Model, opt, dims).then((count) => {
        assert.equal(20, count);
        done();
      });
    });
  });

  describe('statistics', () => {
    it('normal', (done) => {
      const Model = sequelize.define('book', {
        id: {
          type: Sequelize.INTEGER.UNSIGNED,
          primaryKey: true,
          autoIncrement: true,
        },
        name: Sequelize.STRING,
      });
      Model.includes = {
        creator: {
          model: Model,
          as: 'creator',
          required: true,
        },
      };
      Model.stats = {
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
      Model.findAll = (options) => {
        assert.deepEqual({
          attributes: [
            'Date(`createdAt`) AS `date`',
            '`creatorId` AS `user`',
            'COUNT(*) AS `count`',
          ],
          where: {
            $and: [
              { id: { $gte: 200 } },
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
            model: Model,
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

      Model.findOne = (options) => {
        assert.deepEqual({
          where: {
            $and: [
              { id: { $gte: 200 } },
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
            model: Model,
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
      const params = {
        dimensions: 'date,user',
        metrics: 'count',
        id_gte: 200,
        includes: 'creator',
      };
      const where = "`isDelete`='no'";
      const conf = {
        dimensions: {
          date: 'Date(`createdAt`)',
        },
      };
      stats.statistics(Model, params, where, conf).then((result) => {
        assert.equal(20, result[1]);
        assert.deepEqual([{
          date: '2016-04-15',
          user: '小不点',
          count: 100000000,
        }, {
          date: '2016-04-16',
          user: '赵思鸣',
          count: 100000000,
        }], result[0]);
        done();
      });
    });

    it('no listOpts.where/include, where is null', (done) => {
      const Model = sequelize.define('book', {
        id: {
          type: Sequelize.INTEGER.UNSIGNED,
          primaryKey: true,
          autoIncrement: true,
        },
        name: Sequelize.STRING,
      });
      Model.includes = {
        creator: {
          model: Model,
          as: 'creator',
          required: true,
        },
      };
      Model.stats = {
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
      Model.findAll = (options) => {
        assert.deepEqual({
          attributes: [
            'Date(`createdAt`) AS `date`',
            '`creatorId` AS `user`',
            'COUNT(*) AS `count`',
          ],
          group: [
            '`date`',
            '`user`',
          ],
          offset: 0,
          limit: 20,
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
      Model.findOne = (options) => {
        assert.deepEqual({
          raw: true,
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
      const params = {
        dimensions: 'date,user',
        metrics: 'count',
      };
      const conf = {
        dimensions: {
          date: 'Date(`createdAt`)',
        },
      };
      stats.statistics(Model, params, null, conf).then((result) => {
        assert.equal(20, result[1]);
        assert.deepEqual([{
          date: '2016-04-15',
          user: '小不点',
          count: 100000000,
        }, {
          date: '2016-04-16',
          user: '赵思鸣',
          count: 100000000,
        }], result[0]);
        done();
      });
    });

    it('no where, no dimensions', (done) => {
      const Model = sequelize.define('book', {
        id: {
          type: Sequelize.INTEGER.UNSIGNED,
          primaryKey: true,
          autoIncrement: true,
        },
        name: Sequelize.STRING,
      });
      Model.includes = {
        creator: {
          model: Model,
          as: 'creator',
          required: true,
        },
      };
      Model.stats = {
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
      Model.findAll = (options) => {
        assert.deepEqual({
          attributes: [
            'COUNT(*) AS `count`',
          ],
          offset: 0,
          limit: 20,
          where: {
            $and: [
              [
                {
                  $or: [
                    ['Date(`createdAt`)=?', ['2016']],
                  ],
                },
              ],
            ],
          },
          raw: true,
        }, options);
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve([{
              count: 2,
            }]);
          }, 50);
        });
      };
      const params = {
        metrics: 'count',
        filters: 'date==2016',
      };
      const where = null;
      const conf = {
        dimensions: {
          date: 'Date(`createdAt`)',
        },
      };
      stats.statistics(Model, params, where, conf).then((result) => {
        assert.equal(1, result[1]);
        assert.deepEqual([{
          count: 2,
        }], result[0]);
        done();
      });
    });

    it('no listOpts.where/include, where isnt a string', (done) => {
      const Model = sequelize.define('book', {
        id: {
          type: Sequelize.INTEGER.UNSIGNED,
          primaryKey: true,
          autoIncrement: true,
        },
        name: Sequelize.STRING,
      });
      Model.includes = {
        creator: {
          model: Model,
          as: 'creator',
          required: true,
        },
      };
      Model.stats = {
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
      Model.findAll = (options) => {
        assert.deepEqual({
          attributes: [
            'Date(`createdAt`) AS `date`',
            '`creatorId` AS `user`',
            'COUNT(*) AS `count`',
          ],
          group: [
            '`date`',
            '`user`',
          ],
          where: {
            $and: [
              { id: { $eq: 200 } },
            ],
          },
          offset: 0,
          limit: 20,
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

      Model.findOne = (options) => {
        assert.deepEqual({
          raw: true,
          where: {
            $and: [
              { id: { $eq: 200 } },
            ],
          },
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
      const params = {
        dimensions: 'date,user',
        metrics: 'count',
      };
      const conf = {
        dimensions: {
          date: 'Date(`createdAt`)',
        },
      };
      const where = { id: { $eq: 200 } };
      stats.statistics(Model, params, where, conf).then((result) => {
        assert.equal(20, result[1]);
        assert.deepEqual([{
          date: '2016-04-15',
          user: '小不点',
          count: 100000000,
        }, {
          date: '2016-04-16',
          user: '赵思鸣',
          count: 100000000,
        }], result[0]);
        done();
      });
    });

    it('statsCount error', (done) => {
      const Model = sequelize.define('book', {
        id: {
          type: Sequelize.INTEGER.UNSIGNED,
          primaryKey: true,
          autoIncrement: true,
        },
        name: Sequelize.STRING,
      });
      Model.includes = {
        creator: {
          model: Model,
          as: 'creator',
          required: true,
        },
      };
      Model.stats = {
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
      Model.findOne = (options) => {
        assert.deepEqual({
          raw: true,
          where: {
            $and: [
              { id: { $eq: 200 } },
            ],
          },
          attributes: [
            'COUNT(DISTINCT Date(`createdAt`), `creatorId`) AS `count`',
          ],
        }, options);
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            reject(Error('Hello world'));
          }, 50);
        });
      };
      const params = {
        dimensions: 'date,user',
        metrics: 'count',
      };
      const conf = {
        dimensions: {
          date: 'Date(`createdAt`)',
        },
      };
      const where = { id: { $eq: 200 } };
      stats.statistics(Model, params, where, conf).catch((error) => {
        assert.ok(error instanceof Error);
        assert.equal('Hello world', error.message);
        done();
      });
    });

    it('statistics throw expection', (done) => {
      const Model = sequelize.define('book', {
        id: {
          type: Sequelize.INTEGER.UNSIGNED,
          primaryKey: true,
          autoIncrement: true,
        },
        name: Sequelize.STRING,
      });
      Model.includes = {
        creator: {
          model: Model,
          as: 'creator',
          required: true,
        },
      };
      Model.stats = {
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
      Model.findOne = (options) => {
        assert.deepEqual({
          raw: true,
          where: {
            $and: [
              { id: { $eq: 200 } },
            ],
          },
          attributes: [
            'COUNT(DISTINCT Date(`createdAt`), `creatorId`) AS `count`',
          ],
        }, options);
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            reject(Error('Hello world'));
          }, 50);
        });
      };
      const params = {
        dimensions: ['date', 'user'],
        metrics: 'count',
      };
      const conf = {
        dimensions: {
          date: 'Date(`createdAt`)',
        },
      };
      const where = { id: { $eq: 200 } };
      const { logger } = rest.utils;
      rest.utils.logger = {
        error(error) {
          assert.ok(error instanceof Error);
          assert.equal('Dimensions must be a string', error.message);
        },
      };
      stats.statistics(Model, params, where, conf).catch((error) => {
        assert.ok(error instanceof Error);
        assert.equal('Dimensions must be a string', error.message);
        rest.utils.logger = logger;
        done();
      });
    });
  });
});
