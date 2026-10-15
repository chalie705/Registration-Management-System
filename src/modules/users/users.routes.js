const router = require('express').Router();
const Joi = require('joi');
const validate = require('../../middlewares/validate');
const { authenticate, authorize } = require('../../middlewares/auth');
const { ROLES } = require('../../constants/roles');
const ctrl = require('./users.controller');

const idParam = Joi.object({ id: Joi.number().integer().positive().required() });

const createSchema = Joi.object({
  full_name: Joi.string().trim().min(2).max(150).required(),
  email: Joi.string().email({ tlds: { allow: false } }).required(),
  phone: Joi.string().trim().max(30).allow('', null),
  password: Joi.string().min(8).max(72).required(),
  role_id: Joi.number().integer().positive().required(),
});

const updateSchema = Joi.object({
  full_name: Joi.string().trim().min(2).max(150),
  phone: Joi.string().trim().max(30).allow('', null),
  role_id: Joi.number().integer().positive(),
}).min(1);

const statusSchema = Joi.object({ is_active: Joi.boolean().required() });

router.use(authenticate);

router.get('/roles', authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN), ctrl.listRoles);
router.get('/', authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN), ctrl.list);
router.post('/', authorize(ROLES.SUPER_ADMIN), validate(createSchema), ctrl.create);
router.get('/:id', authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN), validate(idParam, 'params'), ctrl.getOne);
router.patch('/:id', authorize(ROLES.SUPER_ADMIN), validate(idParam, 'params'), validate(updateSchema), ctrl.update);
router.patch('/:id/status', authorize(ROLES.SUPER_ADMIN), validate(idParam, 'params'), validate(statusSchema), ctrl.setStatus);

module.exports = router;