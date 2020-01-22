const validator = require('func-args-validator');

const deleteFields = ['isDelete', 'deletorId', 'deletedAt'];

// 删除单个资源的方法
// hook 必选，要删除的实例在 req.hooks 的什么位置
const remove = hook => (
  async (ctx, next) => {
    const model = ctx.hooks[hook];
    if (!model.isDelete) {
      await model.destroy();
    } else {
      model.isDelete = 'yes';
      model.deletorId = ctx.user.id;
      model.deletedAt = new Date();
      await model.save({ fields: deleteFields, validate: false });
    }
    ctx.res.noContent();
    await next();
  }
);

module.exports = () => {
  const schemas = [{
    name: 'hook',
    type: String,
    allowNull: false,
    message: 'Remove instance hook on req.hooks[hook], so `hook` must be a string',
  }];

  return validator(remove, schemas);
};
