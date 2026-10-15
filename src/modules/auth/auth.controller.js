const asyncHandler = require('../../utils/asyncHandler');
const { logAudit } = require('../../utils/audit');
const service = require('./auth.service');

exports.register = asyncHandler(async (req, res) => {
  const user = await service.register(req.body);
  await logAudit(req, { action: 'auth.register', entity: 'users', entityId: user.id, userId: user.id });
  res.status(201).json({ message: 'Registration successful', user });
});

exports.login = asyncHandler(async (req, res) => {
  const result = await service.login(req.body.email, req.body.password);
  await logAudit(req, { action: 'auth.login', entity: 'users', entityId: result.user.id, userId: result.user.id });
  res.json(result);
});

exports.refresh = asyncHandler(async (req, res) => {
  res.json(await service.refresh(req.body.refreshToken));
});

exports.logout = asyncHandler(async (req, res) => {
  await service.logout(req.body.refreshToken);
  res.json({ message: 'Logged out' });
});

exports.me = asyncHandler(async (req, res) => {
  res.json(await service.getProfile(req.user.id));
});

exports.changePassword = asyncHandler(async (req, res) => {
  await service.changePassword(req.user.id, req.body.currentPassword, req.body.newPassword);
  await logAudit(req, { action: 'auth.change_password', entity: 'users', entityId: req.user.id });
  res.json({ message: 'Password changed. Please log in again.' });
});