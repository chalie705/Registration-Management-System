const router = require('express').Router();
const { authenticate, authorize } = require('../../middlewares/auth');
const { ROLES } = require('../../constants/roles');
const ctrl = require('./audit.controller');

router.use(authenticate, authorize(ROLES.AUDITOR, ROLES.SUPER_ADMIN));
router.get('/', ctrl.list);

module.exports = router;