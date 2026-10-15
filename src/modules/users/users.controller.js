const bcrypt = require('bcryptjs');
const { db } = require('../../config/db');
const ApiError = require('../../utils/ApiError');
const asyncHandler = require('../../utils/asyncHandler');
const { getPagination, paginated } = require('../../utils/pagination');
const { logAudit } = require('../../utils/audit');
const { ROLES } = require('../../constants/roles');

const columns = [
  'u.id', 'u.full_name', 'u.email', 'u.phone', 'u.is_active',
  'u.last_login_at', 'u.created_at', 'r.id as role_id', 'r.name as role',
];

exports.listRoles = asyncHandler(async (req, res) => {
  res.json(await db('roles').orderBy('id'));
});

exports.list = asyncHandler(async (req, res) => {
  const pg = getPagination(req.query);
  const { role_id, search, is_active } = req.query;

  const q = db('users as u').join('roles as r', 'r.id', 'u.role_id');
  if (role_id) q.where('u.role_id', role_id);
  if (is_active !== undefined) q.where('u.is_active', is_active === 'true');
  if (search) {
    q.where((b) =>
      b.whereILike('u.full_name', `%${search}%`).orWhereILike('u.email', `%${search}%`)
    );
  }

  const [{ count }] = await q.clone().count('* as count');
  const rows = await q.clone().select(columns).orderBy('u.created_at', 'desc').limit(pg.limit).offset(pg.offset);
  res.json(paginated(rows, Number(count), pg));
});

exports.getOne = asyncHandler(async (req, res) => {
  const user = await db('users as u')
    .join('roles as r', 'r.id', 'u.role_id')
    .where('u.id', req.params.id)
    .select(columns)
    .first();
  if (!user) throw new ApiError(404, 'User not found');
  res.json(user);
});

exports.create = asyncHandler(async (req, res) => {
  const { full_name, email, phone, password, role_id } = req.body;

  const role = await db('roles').where({ id: role_id }).first();
  if (!role) throw new ApiError(404, 'Role not found');

  const [user] = await db('users')
    .insert({
      role_id,
      full_name,
      email: email.toLowerCase(),
      phone,
      password_hash: await bcrypt.hash(password, 10),
    })
    .returning(['id', 'full_name', 'email', 'is_active']);

  if (role.name === ROLES.APPLICANT) await db('applicants').insert({ user_id: user.id });

  await logAudit(req, { action: 'user.create', entity: 'users', entityId: user.id, details: { role: role.name } });
  res.status(201).json({ ...user, role: role.name });
});

exports.update = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const user = await db('users').where({ id }).first();
  if (!user) throw new ApiError(404, 'User not found');

  if (req.body.role_id) {
    if (id === req.user.id) throw new ApiError(400, 'You cannot change your own role');
    if (!(await db('roles').where({ id: req.body.role_id }).first())) throw new ApiError(404, 'Role not found');
  }

  const [updated] = await db('users')
    .where({ id })
    .update({ ...req.body, updated_at: db.fn.now() })
    .returning(['id', 'full_name', 'email', 'phone', 'role_id', 'is_active']);

  await logAudit(req, { action: 'user.update', entity: 'users', entityId: id, details: req.body });
  res.json(updated);
});

exports.setStatus = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (id === req.user.id) throw new ApiError(400, 'You cannot disable your own account');

  const [updated] = await db('users')
    .where({ id })
    .update({ is_active: req.body.is_active, updated_at: db.fn.now() })
    .returning(['id', 'email', 'is_active']);
  if (!updated) throw new ApiError(404, 'User not found');

  await logAudit(req, { action: 'user.set_status', entity: 'users', entityId: id, details: { is_active: updated.is_active } });
  res.json(updated);
});