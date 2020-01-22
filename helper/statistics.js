const validator = require('func-args-validator');
const _ = require('lodash');
const statsModule = require('../lib/stats');


module.exports = (rest) => {
  const { Sequelize } = rest;

  const stats = statsModule(rest);

  /**
   * 获取单个资源详情的方法
   * Model 必选，Sequlize 定义的Model，表明数据从哪里获取
   * where 可选，额外的条件, req 对象上的路径，例如 'hooks.option.where',
   * hook 可选, 默认为空，如果指定了hook，则数据不直接输出而是先挂在 hook上
   * conf 可选，统计功能的配置，req 对象上值的路径例如 'hooks.user.conf'
   */
  const statistics = (Model, _where, hook, _conf) => (
    async (ctx, next) => {
      const conf = _conf ? _.get(ctx, _conf) : null;
      const where = _where ? _.get(ctx, _where) : '';
      try {
        const ret = await stats.statistics(Model, ctx.params, where, conf);
        const [data, total] = ret;
        ctx.set('X-Content-Record-Total', total);
        if (hook) {
          ctx.hooks[hook] = data;
          await next();
        } else {
          ctx.res.ok({
            data,
          });
        }
      } catch (error) {
        ctx.res.sequelizeIfError(error);
      }
    }
  );

  const schemas = [{
    name: 'Model',
    type: Sequelize.Model,
    message: 'Model must be a class of Sequelize defined',
  }, {
    name: 'where',
    type: String,
    allowNull: true,
    message: 'FindAll option condition, ctx\'s value path, so `where` must be a string',
  }, {
    name: 'hook',
    type: String,
    allowNull: true,
    message: 'Geted statistics data will hook on ctx.hooks[hook], so `hook` must be a string',
  }, {
    name: 'conf',
    type: String,
    allowNull: true,
    message: 'Status dynamic config, ctx\'s value path',
  }];

  return validator(statistics, schemas);
};
