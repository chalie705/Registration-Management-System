const { db } = require('../config/db');

async function logAudit(req, { action, entity, entityId = null, details = null, userId }) {
  try {
    await db('audit_logs').insert({
      user_id: userId ?? req.user?.id ?? null,
      action,
      entity,
      entity_id: entityId,
      ip_address: req.ip,
      user_agent: (req.headers['user-agent'] || '').slice(0, 255),
      details: details ? JSON.stringify(details) : null,
    });
  } catch (err) {
    console.error('Audit log failed:', err.message);
  }
}

module.exports = { logAudit };