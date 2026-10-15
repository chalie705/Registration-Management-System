const router = require('express').Router();
const Joi = require('joi');
const validate = require('../../middlewares/validate');
const upload = require('../../middlewares/upload');
const { authenticate, authorize } = require('../../middlewares/auth');
const { ROLES } = require('../../constants/roles');
const { REVIEW_DECISIONS, APPLICATION_STATUS } = require('../../constants/statuses');
const ctrl = require('./applications.controller');

const idParam = Joi.object({ id: Joi.number().integer().positive().required() });

const createSchema = Joi.object({
  program_id: Joi.number().integer().positive().required(),
  period_id: Joi.number().integer().positive().required(),
  statement: Joi.string().allow('', null).max(5000),
});

const updateSchema = Joi.object({
  program_id: Joi.number().integer().positive(),
  period_id: Joi.number().integer().positive(),
  statement: Joi.string().allow('', null).max(5000),
}).min(1);

const reviewSchema = Joi.object({
  decision: Joi.string().valid(...REVIEW_DECISIONS).required(),
  score: Joi.number().integer().min(0).max(100),
  comments: Joi.string().allow('', null).max(3000),
});

const decisionSchema = Joi.object({
  decision: Joi.string().valid(APPLICATION_STATUS.APPROVED, APPLICATION_STATUS.REJECTED).required(),
  remarks: Joi.when('decision', {
    is: APPLICATION_STATUS.REJECTED,
    then: Joi.string().min(3).required(),
    otherwise: Joi.string().allow('', null),
  }),
});

const { SUPER_ADMIN, ADMIN, REVIEWER, FINANCE, APPLICANT, AUDITOR } = ROLES;
const params = validate(idParam, 'params');

router.use(authenticate);

router.get('/my', authorize(APPLICANT), ctrl.listMine);
router.get('/', authorize(SUPER_ADMIN, ADMIN, REVIEWER, FINANCE, AUDITOR), ctrl.listAll);
router.post('/', authorize(APPLICANT), validate(createSchema), ctrl.create);
router.get('/:id', params, ctrl.getOne);
router.patch('/:id', authorize(APPLICANT), params, validate(updateSchema), ctrl.updateDraft);
router.post('/:id/documents', authorize(APPLICANT), params, upload.single('file'), ctrl.uploadDocument);
router.post('/:id/submit', authorize(APPLICANT), params, ctrl.submit);
router.post('/:id/review', authorize(REVIEWER), params, validate(reviewSchema), ctrl.review);
router.post('/:id/decision', authorize(ADMIN, SUPER_ADMIN), params, validate(decisionSchema), ctrl.decide);

module.exports = router;