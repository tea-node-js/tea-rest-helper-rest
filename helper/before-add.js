const delegate = require('func-delegate');
const _ = require('lodash');
const U = require('../lib/utils');

module.exports = (rest) => {
  const { Sequelize } = rest;

  /**
   * 修改某个资源描述的前置方法, 不会sync到数据库
   * Model 必选, Sequlize 定义的Model，表明数据的原型
   * cols 可选, 允许设置的字段
   * hook 必选, 生成实例的存放位置
   */
  const beforeAdd = (Model, cols) => (
    async (ctx) => {
      const attr = U.pickParams(ctx, cols || Model.writableCols, Model);

      // 存储数据
      const _save = async (model) => {
        const mod = await model.save();
        return mod;
      };

      // 约定的 creatorId, 等于 ctx.user.id
      if (Model.rawAttributes.creatorId) attr.creatorId = ctx.user.id;
      // 约定的 clientIp, 等于rest.utils.clientIp(ctx)
      if (Model.rawAttributes.clientIp) attr.clientIp = rest.utils.clientIp(ctx);

      // 如果没有设置唯一属性，或者没有开启回收站
      if ((!Model.unique) || (!Model.rawAttributes.isDelete)) {
        const mod = await _save(Model.build(attr));
        return mod;
      }

      // 如果设置了唯一属性，且开启了回收站功能
      // 则判断是否需要执行恢复操作
      const where = {};
      _.each(Model.unique, (x) => {
        where[x] = attr[x];
      });

      const _model = await Model.findOne({ where });

      if (_model) {
        // 且资源曾经被删除
        if (_model.isDelete === 'yes') {
          _.extend(_model, attr);
          // 恢复为正常状态
          _model.isDelete = 'no';
        } else {
          throw Error('Resource exists.');
        }
      }

      const mod = _save(_model || Model.build(attr));

      return mod;
    }
  );

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
  }];

  return delegate(beforeAdd, schemas);
};
