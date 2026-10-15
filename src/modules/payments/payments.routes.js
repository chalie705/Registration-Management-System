const router = require('express').Router();
const Joi = require('joi');
const validate = require('../../middlewares/validate');
const { authenticate, authorize } = require('../../middlewares/auth');
const { ROLES } = require('../../constants/roles');
const { PAYMENT_METHODS, PAYMENT_STATUS } = require('../../constants/statuses');
const ctrl = require('./payments.controller');

const idParam = Joi.object({ id: Joi.number().integer().positive().required() });

const createSchema = Joi.object({
  application_id: Joi.number().integer().positive().required(),
  fee_id: Joi.number().integer().positive().required(),
  amount: Joi.number().positive().required(),
  method: Joi.string().valid(...PAYMENT_METHODS).required(),
  reference: Joi.string().trim().max(100).required(),
});

const confirmSchema = Joi.object({
  status: Joi.string().valid(PAYMENT_STATUS.CONFIRMED, PAYMENT_STATUS.REJECTED).required(),
  remarks: Joi.string().allow('', null).max(1000),
});

const { SUPER_ADMIN, ADMIN, FINANCE, APPLICANT, AUDITOR } = ROLES;

router.use(authenticate);
router.post('/', authorize(APPLICANT), validate(createSchema), ctrl.create);
router.get('/my', authorize(APPLICANT), ctrl.listMine);
router.get('/', authorize(SUPER_ADMIN, ADMIN, FINANCE, AUDITOR), ctrl.listAll);
router.patch('/:id/confirm', authorize(FINANCE, SUPER_ADMIN), validate(idParam, 'params'), validate(confirmSchema), ctrl.confirm);

module.exports = router;