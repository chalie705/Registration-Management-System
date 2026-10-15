const { ROLES } = require('../../constants/roles');

const permissions = [
  ['users.manage', 'Create and manage users'],
  ['programs.manage', 'Manage programs'],
  ['periods.manage', 'Manage registration periods'],
  ['applications.create', 'Create and submit own applications'],
  ['applications.view_all', 'View all submitted applications'],
  ['applications.review', 'Review applications'],
  ['applications.decide', 'Approve or reject applications'],
  ['fees.manage', 'Manage fees'],
  ['payments.confirm', 'Confirm or reject payments'],
  ['audit.view', 'View audit logs'],
];

const rolePerms = {
  [ROLES.SUPER_ADMIN]: permissions.map((p) => p[0]),
  [ROLES.ADMIN]: ['programs.manage', 'periods.manage', 'applications.view_all', 'applications.decide', 'fees.manage'],
  [ROLES.REVIEWER]: ['applications.view_all', 'applications.review'],
  [ROLES.FINANCE]: ['applications.view_all', 'fees.manage', 'payments.confirm'],
  [ROLES.APPLICANT]: ['applications.create'],
  [ROLES.AUDITOR]: ['applications.view_all', 'audit.view'],
};

exports.seed = async (knex) => {
  await knex('roles')
    .insert(Object.values(ROLES).map((name) => ({ name, description: `${name} role` })))
    .onConflict('name')
    .ignore();

  await knex('permissions')
    .insert(permissions.map(([code, description]) => ({ code, description })))
    .onConflict('code')
    .ignore();

  const roles = await knex('roles');
  const perms = await knex('permissions');

  const rows = [];
  for (const [roleName, codes] of Object.entries(rolePerms)) {
    const role = roles.find((r) => r.name === roleName);
    for (const code of codes) {
      rows.push({ role_id: role.id, permission_id: perms.find((p) => p.code === code).id });
    }
  }

  await knex('role_permissions').insert(rows).onConflict(['role_id', 'permission_id']).ignore();
};
