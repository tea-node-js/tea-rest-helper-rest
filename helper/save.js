const validator = require('func-args-validator');

module.exports = () => {
  /**
   * 修改某个资源描述的后置方法, 将变化保存到数据库
   * hook 必选, 实例的存放位置
   */
  const save = hook => (
    async (ctx, next) => {
      const model = ctx.hooks[hook];
      const changed = model.changed();
      // 如果没有变化，则不需要保存，也不需要记录日志
      if (!changed) {
        ctx._resourceNotChanged = true;
        ctx.set('X-Content-Resource-Status', 'Unchanged');
        ctx.res.ok({
          data: model,
        });
        await next();
      } else {
        try {
          const _model = await model.save({ fields: changed });
          ctx.res.ok({
            data: _model,
          });
          await next();
        } catch (error) {
          ctx.res.sequelizeIfError(error);
        }
      }
    }
  );

  const schemas = [{
    name: 'hook',
    type: String,
    allowNull: false,
    message: 'Will modify instance hook on ctx.hooks[hook], so `hook` must be a string',
  }];

  return validator(save, schemas);
};
