const { db } = require('../../config/db');
const ApiError = require('../../utils/ApiError');
const asyncHandler = require('../../utils/asyncHandler');
const { logAudit } = require('../../utils/audit');
const { ROLES } = require('../../constants/roles');

exports.list = asyncHandler(async (req, res) => {
  const q = db('programs').orderBy('name');
  if (req.user.role === ROLES.APPLICANT || req.query.active === 'true') q.where({ is_active: true });
  res.json(await q);
});

exports.getOne = asyncHandler(async (req, res) => {
  const program = await db('programs').where({ id: req.params.id }).first();
  if (!program) throw new ApiError(404, 'Program not found');
  res.json(program);
});

exports.create = asyncHandler(async (req, res) => {
  const [program] = await db('programs').insert(req.body).returning('*');
  await logAudit(req, { action: 'program.create', entity: 'programs', entityId: program.id });
  res.status(201).json(program);
});

exports.update = asyncHandler(async (req, res) => {
  const [program] = await db('programs')
    .where({ id: req.params.id })
    .update({ ...req.body, updated_at: db.fn.now() })
    .returning('*');
  if (!program) throw new ApiError(404, 'Program not found');
  await logAudit(req, { action: 'program.update', entity: 'programs', entityId: program.id, details: req.body });
  res.json(program);
});

exports.remove = asyncHandler(async (req, res) => {
  const [program] = await db('programs')
    .where({ id: req.params.id })
    .update({ is_active: false, updated_at: db.fn.now() })
    .returning('*');
  if (!program) throw new ApiError(404, 'Program not found');
  await logAudit(req, { action: 'program.deactivate', entity: 'programs', entityId: program.id });
  res.json({ message: 'Program deactivated', program });
});