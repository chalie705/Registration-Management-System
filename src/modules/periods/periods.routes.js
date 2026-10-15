const router = require('express').Router();
const Joi = require('joi');
const validate = require('../../middlewares/validate');
const { authenticate, authorize } = require('../../middlewares/auth');
const { ROLES } = require('../../constants/roles');
const ctrl = require('./periods.controller');

const idParam = Joi.object({ id: Joi.number().integer().positive().required() });
const date = Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).message('must be YYYY-MM-DD');

const createSchema = Joi.object({
  name: Joi.string().trim().max(150).required(),
  academic_year: Joi.string().trim().max(20).required(),
  start_date: date.required(),
  end_date: date.required(),
  is_open: Joi.boolean(),
});

const updateSchema = Joi.object({
  name: Joi.string().trim().max(150),
  academic_year: Joi.string().trim().max(20),
  start_date: date,
  end_date: date,
  is_open: Joi.boolean(),
}).min(1);

const manage = authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN);

router.use(authenticate);
router.get('/', ctrl.list);
router.post('/', manage, validate(createSchema), ctrl.create);
router.put('/:id', manage, validate(idParam, 'params'), validate(updateSchema), ctrl.update);

module.exports = router;