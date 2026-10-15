const { db } = require('../../config/db');
const ApiError = require('../../utils/ApiError');
const asyncHandler = require('../../utils/asyncHandler');
const { getPagination, paginated } = require('../../utils/pagination');
const { logAudit } = require('../../utils/audit');
const { PAYMENT_STATUS: PS } = require('../../constants/statuses');

const baseQuery = () =>
  db('payments as pay')
    .join('applications as a', 'a.id', 'pay.application_id')
    .join('applicants as ap', 'ap.id', 'a.applicant_id')
    .join('users as u', 'u.id', 'ap.user_id')
    .join('fees as f', 'f.id', 'pay.fee_id');

const columns = [
  'pay.id', 'pay.amount', 'pay.method', 'pay.reference', 'pay.status', 'pay.remarks',
  'pay.created_at', 'pay.confirmed_at', 'a.id as application_id', 'a.application_no',
  'u.full_name as applicant_name', 'f.name as fee_name',
];

exports.create = asyncHandler(async (req, res) => {
  const { application_id, fee_id, amount, method, reference } = req.body;

  const app = await db('applications as a')
    .join('applicants as ap', 'ap.id', 'a.applicant_id')
    .where('a.id', application_id)
    .where('ap.user_id', req.user.id)
    .select('a.*')
    .first();
  if (!app) throw new ApiError(404, 'Application not found');

  const fee = await db('fees').where({ id: fee_id, is_active: true }).first();
  if (!fee) throw new ApiError(404, 'Fee not found or inactive');
  if (fee.program_id && fee.program_id !== app.program_id) {
    throw new ApiError(422, 'This fee does not apply to the selected program');
  }

  const [payment] = await db('payments')
    .insert({ application_id, fee_id, amount, method, reference, status: PS.PENDING, recorded_by: req.user.id })
    .returning('*');

  await logAudit(req, { action: 'payment.create', entity: 'payments', entityId: payment.id, details: { amount, reference } });
  res.status(201).json(payment);
});

exports.listMine = asyncHandler(async (req, res) => {
  const rows = await baseQuery().where('ap.user_id', req.user.id).select(columns).orderBy('pay.created_at', 'desc');
  res.json(rows);
});

exports.listAll = asyncHandler(async (req, res) => {
  const pg = getPagination(req.query);
  const { status, application_id } = req.query;

  const q = baseQuery();
  if (status) q.where('pay.status', status);
  if (application_id) q.where('pay.application_id', application_id);

  const [{ count }] = await q.clone().count('* as count');
  const rows = await q.clone().select(columns).orderBy('pay.created_at', 'desc').limit(pg.limit).offset(pg.offset);
  res.json(paginated(rows, Number(count), pg));
});

exports.confirm = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const payment = await db('payments').where({ id }).first();
  if (!payment) throw new ApiError(404, 'Payment not found');
  if (payment.status !== PS.PENDING) throw new ApiError(409, `Payment is already ${payment.status}`);

  const [updated] = await db('payments')
    .where({ id })
    .update({
      status: req.body.status,
      remarks: req.body.remarks,
      confirmed_by: req.user.id,
      confirmed_at: db.fn.now(),
      updated_at: db.fn.now(),
    })
    .returning('*');

  await logAudit(req, { action: `payment.${req.body.status}`, entity: 'payments', entityId: id });
  res.json(updated);
});