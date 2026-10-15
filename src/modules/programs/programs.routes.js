const router = require('express').Router();
const Joi = require('joi');
const validate = require('../../middlewares/validate');
const { authenticate, authorize } = require('../../middlewares/auth');
const { ROLES } = require('../../constants/roles');
const ctrl = require('./programs.controller');

const idParam = Joi.object({ id: Joi.number().integer().positive().required() });

const createSchema = Joi.object({
  code: Joi.string().trim().max(20).required(),
  name: Joi.string().trim().max(150).required(),
  description: Joi.string().allow('', null),
  tuition_fee: Joi.number().min(0),
  capacity: Joi.number().integer().min(0),
  is_active: Joi.boolean(),
});
const updateSchema = createSchema.fork(['code', 'name'], (s) => s.optional()).min(1);

const manage = authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN);

router.use(authenticate);
router.get('/', ctrl.list);
router.get('/:id', validate(idParam, 'params'), ctrl.getOne);
router.post('/', manage, validate(createSchema), ctrl.create);
router.put('/:id', manage, validate(idParam, 'params'), validate(updateSchema), ctrl.update);
router.delete('/:id', manage, validate(idParam, 'params'), ctrl.remove);

module.exports = router;