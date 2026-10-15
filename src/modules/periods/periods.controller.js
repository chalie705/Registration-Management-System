const { db } = require('../../config/db');
const ApiError = require('../../utils/ApiError');
const asyncHandler = require('../../utils/asyncHandler');
const { logAudit } = require('../../utils/audit');
const { ROLES } = require('../../constants/roles');

exports.list = asyncHandler(async (req, res) => {
  const q = db('registration_periods').orderBy('start_date', 'desc');
  if (req.user.role === ROLES.APPLICANT) q.where({ is_open: true });
  res.json(await q);
});

exports.create = asyncHandler(async (req, res) => {
  if (req.body.end_date <= req.body.start_date) {
    throw new ApiError(422, 'end_date must be after start_date');
  }
  const [period] = await db('registration_periods')
    .insert({ ...req.body, created_by: req.user.id })
    .returning('*');
  await logAudit(req, { action: 'period.create', entity: 'registration_periods', entityId: period.id });
  res.status(201).json(period);
});

exports.update = asyncHandler(async (req, res) => {
  const [period] = await db('registration_periods')
    .where({ id: req.params.id })
    .update({ ...req.body, updated_at: db.fn.now() })
    .returning('*');
  if (!period) throw new ApiError(404, 'Registration period not found');
  await logAudit(req, { action: 'period.update', entity: 'registration_periods', entityId: period.id, details: req.body });
  res.json(period);
});