const validator = require('func-args-validator');
const _ = require('lodash');
const beforeModify = require('./before-modify');
const save = require('./save');


module.exports = (rest) => {
  const { Sequelize } = rest;

  /**
   * 修改某个资源描述的方法
   * Model 必选, Sequlize 定义的Model，表明数据的原型
   * hook 必选, 实例的存放位置
   * cols 可选, 允许修改的字段
   */
  const modify = (Model, hook, cols) => {
    const before = beforeModify(rest)(Model, hook, cols);
    const after = save(rest)(hook);

    return async (ctx, next) => {
      try {
        await before(ctx);
        await after(ctx, next);
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
    name: 'hook',
    type: String,
    allowNull: false,
    message: 'Will modify instance hook on req.hooks[hook], so `hook` must be a string',
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
    message: 'Allow modify attrs\'s name array',
  }];

  return validator(modify, schemas);
};
