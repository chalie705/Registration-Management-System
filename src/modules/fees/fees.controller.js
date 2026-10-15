const { db } = require('../../config/db');
const ApiError = require('../../utils/ApiError');
const asyncHandler = require('../../utils/asyncHandler');
const { logAudit } = require('../../utils/audit');
const { ROLES } = require('../../constants/roles');

exports.list = asyncHandler(async (req, res) => {
  const q = db('fees as f')
    .leftJoin('programs as p', 'p.id', 'f.program_id')
    .select('f.*', 'p.name as program_name')
    .orderBy('f.created_at', 'desc');
  if (req.query.program_id) q.where((b) => b.where('f.program_id', req.query.program_id).orWhereNull('f.program_id'));
  if (req.user.role === ROLES.APPLICANT) q.where('f.is_active', true);
  res.json(await q);
});

exports.create = asyncHandler(async (req, res) => {
  const [fee] = await db('fees').insert(req.body).returning('*');
  await logAudit(req, { action: 'fee.create', entity: 'fees', entityId: fee.id });
  res.status(201).json(fee);
});

exports.update = asyncHandler(async (req, res) => {
  const [fee] = await db('fees')
    .where({ id: req.params.id })
    .update({ ...req.body, updated_at: db.fn.now() })
    .returning('*');
  if (!fee) throw new ApiError(404, 'Fee not found');
  await logAudit(req, { action: 'fee.update', entity: 'fees', entityId: fee.id, details: req.body });
  res.json(fee);
});