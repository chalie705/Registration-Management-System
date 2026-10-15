const router = require('express').Router();
const Joi = require('joi');
const validate = require('../../middlewares/validate');
const { authenticate, authorize } = require('../../middlewares/auth');
const { ROLES } = require('../../constants/roles');
const ctrl = require('./fees.controller');

const idParam = Joi.object({ id: Joi.number().integer().positive().required() });

const createSchema = Joi.object({
  program_id: Joi.number().integer().positive().allow(null),
  name: Joi.string().trim().max(150).required(),
  amount: Joi.number().min(0).required(),
  due_date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).allow(null),
  is_active: Joi.boolean(),
});
const updateSchema = createSchema.fork(['name', 'amount'], (s) => s.optional()).min(1);

const manage = authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.FINANCE);

router.use(authenticate);
router.get('/', ctrl.list);
router.post('/', manage, validate(createSchema), ctrl.create);
router.put('/:id', manage, validate(idParam, 'params'), validate(updateSchema), ctrl.update);

module.exports = router;