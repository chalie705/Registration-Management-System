const { db } = require('../config/db');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { verifyAccessToken } = require('../utils/token');

const authenticate = asyncHandler(async (req, res, next) => {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) throw new ApiError(401, 'Authentication required');

  const payload = verifyAccessToken(token);
  const user = await db('users as u')
    .join('roles as r', 'r.id', 'u.role_id')
    .where('u.id', payload.sub)
    .select('u.id', 'u.full_name', 'u.email', 'u.is_active', 'r.name as role')
    .first();

  if (!user || !user.is_active) throw new ApiError(401, 'Account not found or disabled');

  req.user = { id: user.id, fullName: user.full_name, email: user.email, role: user.role };
  next();
});

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(new ApiError(403, 'You do not have permission to perform this action'));
  }
  next();
};

module.exports = { authenticate, authorize };