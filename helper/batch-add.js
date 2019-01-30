const util = require('util');
const delegate = require('func-delegate');
const map = require('async/map');
const _ = require('lodash');
const U = require('../lib/utils');

const asyncMap = util.promisify(map);

module.exports = (rest) => {
  const { Sequelize } = rest;

  /** 输出 */
  const detail = (hook, attachs) => (
    async (ctx, next) => {
      const results = _.isArray(ctx.request.body) ? ctx.hooks[hook] : [ctx.hooks[hook]];
      let ret = _.map(results, (model) => {
        const json = (model.toJSON instanceof Function) ? model.toJSON() : model;
        if (attachs) {
          _.each(attachs, (v, k) => {
            json[k] = _.get(ctx, v);
          });
        }
        return json;
      });
      if (!_.isArray(ctx.request.body) && ret.length === 1) [ret] = ret;
      if (_.isArray(ret)) {
        ctx.res.noContent();
      } else {
        ctx.res.created({
          data: ret,
        });
      }
      await next();
    }
  );

  /** 批量验证 */
  const validate = (Model, cols, hook) => (
    async (ctx) => {
      const body = _.isArray(ctx.request.body) ? ctx.request.body : [ctx.request.body];
      const origParams = _.clone(ctx.params);

      const handler = async (params) => {
        ctx.params = _.extend(params, origParams);
        const attr = U.pickParams(ctx, cols || Model.writableCols, Model);
        if (Model.rawAttributes.creatorId) attr.creatorId = ctx.user.id;
        if (Model.rawAttributes.clientIp) attr.clientIp = rest.utils.clientIp(ctx);

        const model = await Model.build(attr);

        await model.validate();

        return model;
      };

      const results = await asyncMap(body, handler);
      ctx.hooks[hook] = results;
    }
  );

  /** 保存 */
  const save = (hook, Model, opt) => (
    async (ctx) => {
      const ls = _.map(ctx.hooks[hook], x => ((x.toJSON instanceof Function) ? x.toJSON() : x));
      const p = _.isArray(ctx.request.body) ? Model.bulkCreate(ls, opt) : Model.create(ls[0], opt);

      const results = await p;
      ctx.hooks[hook] = results;
      if (!_.isArray(results)) {
        await results.reload();
      }
    }
  );

  /** 批量添加 */
  const batchAdd = (Model, cols, hook, attachs, createOpt) => {
    const _hook = hook || `${Model.name}s`;
    const _validate = validate(Model, cols, _hook);
    const _save = save(_hook, Model, createOpt);
    const _detail = detail(_hook, attachs);

    return async (ctx, next) => {
      try {
        await _validate(ctx);
        await _save(ctx);
        await _detail(ctx, next);
      } catch (error) {
        ctx.res.sequelizeIfError(error);
      }
    };
  };

  const schemas = [{
    name: 'Model',
    type: Sequelize.Model,
    message: 'Model must be a class of Sequelize defined',
  }, {
    name: 'cols',
    type: Array,
    allowNull: true,
    validate: {
      check(keys, schema, args) {
        const Model = args[0];
        _.each(keys, (v) => {
          if (!_.isString(v)) {
            throw Error('Every item in cols must be a string.');
          }
          if (!Model.rawAttributes[v]) {
            throw Error(`Attr non-exists: ${v}`);
          }
        });
        return true;
      },
    },
    message: 'Allow writed attrs\'s name array',
  }, {
    name: 'hook',
    type: String,
    allowNull: true,
    message: 'Added instance will hook on ctx.hooks[hook], so `hook` must be a string',
  }, {
    name: 'attachs',
    type: Object,
    allowNull: true,
    validate: {
      check(value) {
        _.each(value, (v) => {
          if (!_.isString(v)) {
            throw Error('The attachs structure is key = > value, value must be a string');
          }
        });
        return true;
      },
    },
    message: 'Attach other data dict. key => value, value is ctx\'s path',
  }, {
    /**
     * [options]  Object
     * [options.raw=false]  Boolean
     * [options.isNewRecord=true] Boolean
     * [options.fields] Array
     * [options.include]  Array
     * [options.onDuplicate]  String
     * [options.transaction]  Transaction
     * [options.logging=false]  Function
     * [options.benchmark=false]  Boolean
     */
    name: 'createOpt',
    type: Object,
    allowNull: true,
    message: 'Sequelize create & bulkCreate the second argument',
  }];

  return delegate(batchAdd, schemas);
};
