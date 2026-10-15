const { db } = require('../../config/db');
const asyncHandler = require('../../utils/asyncHandler');
const { getPagination, paginated } = require('../../utils/pagination');

exports.list = asyncHandler(async (req, res) => {
  const pg = getPagination(req.query);
  const { user_id, entity, action, from, to } = req.query;

  const q = db('audit_logs as l').leftJoin('users as u', 'u.id', 'l.user_id');
  if (user_id) q.where('l.user_id', user_id);
  if (entity) q.where('l.entity', entity);
  if (action) q.whereILike('l.action', `${action}%`);
  if (from) q.where('l.created_at', '>=', from);
  if (to) q.where('l.created_at', '<=', to);

  const [{ count }] = await q.clone().count('* as count');
  const rows = await q
    .clone()
    .select('l.*', 'u.email as user_email', 'u.full_name as user_name')
    .orderBy('l.created_at', 'desc')
    .limit(pg.limit)
    .offset(pg.offset);

  res.json(paginated(rows, Number(count), pg));
});