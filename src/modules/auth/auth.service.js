const bcrypt = require('bcryptjs');
const { db } = require('../../config/db');
const ApiError = require('../../utils/ApiError');
const { ROLES } = require('../../constants/roles');
const { jwt: jwtCfg } = require('../../config/env');
const { signAccessToken, generateRefreshToken, hashToken } = require('../../utils/token');

const findUserWithRole = (where) =>
  db('users as u')
    .join('roles as r', 'r.id', 'u.role_id')
    .where(where)
    .select('u.id', 'u.full_name', 'u.email', 'u.phone', 'u.password_hash', 'u.is_active', 'r.name as role')
    .first();

const publicUser = (u) => ({
  id: u.id,
  fullName: u.full_name,
  email: u.email,
  phone: u.phone,
  role: u.role,
});

async function issueTokens(user) {
  const accessToken = signAccessToken(user);
  const { token, hash } = generateRefreshToken();
  const expiresAt = new Date(Date.now() + jwtCfg.refreshDays * 24 * 60 * 60 * 1000);
  await db('refresh_tokens').insert({ user_id: user.id, token_hash: hash, expires_at: expiresAt });
  return { accessToken, refreshToken: token };
}

exports.register = async ({ full_name, email, phone, password }) => {
  const lower = email.toLowerCase();
  if (await db('users').where({ email: lower }).first()) {
    throw new ApiError(409, 'Email is already registered');
  }
  const role = await db('roles').where({ name: ROLES.APPLICANT }).first();
  if (!role) throw new ApiError(500, 'Roles not seeded. Run: npm run seed');
  const password_hash = await bcrypt.hash(password, 10);
  const created = await db.transaction(async (trx) => {
    const [u] = await trx('users')
      .insert({ role_id: role.id, full_name, email: lower, phone, password_hash })
      .returning('id');
    await trx('applicants').insert({ user_id: u.id });
    return u;
  });
  return publicUser(await findUserWithRole({ 'u.id': created.id }));
};

exports.login = async (email, password) => {
  const user = await findUserWithRole({ 'u.email': email.toLowerCase() });
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    throw new ApiError(401, 'Invalid email or password');
  }
  if (!user.is_active) throw new ApiError(403, 'Your account has been disabled');
  await db('users').where({ id: user.id }).update({ last_login_at: db.fn.now() });
  const tokens = await issueTokens(user);
  return { user: publicUser(user), ...tokens };
};

exports.refresh = async (refreshToken) => {
  const row = await db('refresh_tokens')
    .where({ token_hash: hashToken(refreshToken) })
    .whereNull('revoked_at')
    .where('expires_at', '>', db.fn.now())
    .first();
  if (!row) throw new ApiError(401, 'Invalid or expired refresh token');
  const user = await findUserWithRole({ 'u.id': row.user_id });
  if (!user || !user.is_active) throw new ApiError(401, 'Account not found or disabled');
  await db('refresh_tokens').where({ id: row.id }).update({ revoked_at: db.fn.now() });
  return { user: publicUser(user), ...(await issueTokens(user)) };
};

exports.logout = async (refreshToken) => {
  await db('refresh_tokens')
    .where({ token_hash: hashToken(refreshToken) })
    .whereNull('revoked_at')
    .update({ revoked_at: db.fn.now() });
};

exports.getProfile = async (userId) => {
  const user = await findUserWithRole({ 'u.id': userId });
  if (!user) throw new ApiError(404, 'User not found');
  return publicUser(user);
};

exports.changePassword = async (userId, currentPassword, newPassword) => {
  const user = await findUserWithRole({ 'u.id': userId });
  if (!(await bcrypt.compare(currentPassword, user.password_hash))) {
    throw new ApiError(400, 'Current password is incorrect');
  }
  await db('users')
    .where({ id: userId })
    .update({ password_hash: await bcrypt.hash(newPassword, 10), updated_at: db.fn.now() });
  await db('refresh_tokens').where({ user_id: userId }).whereNull('revoked_at').update({ revoked_at: db.fn.now() });
};