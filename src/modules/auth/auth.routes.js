const router = require('express').Router();
const Joi = require('joi');
const validate = require('../../middlewares/validate');
const { authenticate } = require('../../middlewares/auth');
const ctrl = require('./auth.controller');

const password = Joi.string().min(8).max(72).required();
const email = Joi.string().email({ tlds: { allow: false } }).required();

const registerSchema = Joi.object({
  full_name: Joi.string().trim().min(2).max(150).required(),
  email,
  phone: Joi.string().trim().max(30).allow('', null),
  password,
});

const loginSchema = Joi.object({
  email,
  password: Joi.string().required(),
});

const tokenSchema = Joi.object({ refreshToken: Joi.string().required() });

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: password,
});

router.post('/register', validate(registerSchema), ctrl.register);
router.post('/login', validate(loginSchema), ctrl.login);
router.post('/refresh', validate(tokenSchema), ctrl.refresh);
router.post('/logout', validate(tokenSchema), ctrl.logout);
router.get('/me', authenticate, ctrl.me);
router.post('/change-password', authenticate, validate(changePasswordSchema), ctrl.changePassword);

module.exports = router;