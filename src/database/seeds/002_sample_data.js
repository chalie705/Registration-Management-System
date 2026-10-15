const bcrypt = require('bcryptjs');
const { ROLES } = require('../../constants/roles');

exports.seed = async (knex) => {
  const hash = await bcrypt.hash('Admin@12345', 10);
  const roles = await knex('roles');
  const roleId = (name) => roles.find((r) => r.name === name).id;

  const users = [
    ['System Super Admin', 'superadmin@rms.local', ROLES.SUPER_ADMIN],
    ['Main Registrar', 'registrar@rms.local', ROLES.ADMIN],
    ['Sample Reviewer', 'reviewer@rms.local', ROLES.REVIEWER],
    ['Finance Officer', 'finance@rms.local', ROLES.FINANCE],
    ['Sample Auditor', 'auditor@rms.local', ROLES.AUDITOR],
    ['Sample Applicant', 'applicant@rms.local', ROLES.APPLICANT],
  ];

  await knex('users')
    .insert(
      users.map(([full_name, email, role]) => ({
        full_name,
        email,
        role_id: roleId(role),
        password_hash: hash,
      }))
    )
    .onConflict('email')
    .ignore();

  const applicantUser = await knex('users').where({ email: 'applicant@rms.local' }).first();
  await knex('applicants').insert({ user_id: applicantUser.id }).onConflict('user_id').ignore();

  await knex('programs')
    .insert([
      { code: 'BSC-CS', name: 'BSc Computer Science', description: 'Four-year program', tuition_fee: 1500, capacity: 100 },
      { code: 'BSC-IT', name: 'BSc Information Technology', description: 'Four-year program', tuition_fee: 1400, capacity: 80 },
    ])
    .onConflict('code')
    .ignore();

  if (!(await knex('registration_periods').first())) {
    const start = new Date();
    const end = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
    const fmt = (d) => d.toISOString().slice(0, 10);
    await knex('registration_periods').insert({
      name: 'Main Intake',
      academic_year: '2026/2027',
      start_date: fmt(start),
      end_date: fmt(end),
      is_open: true,
    });
  }

  if (!(await knex('fees').first())) {
    await knex('fees').insert({ name: 'Registration Fee', amount: 50 });
  }
};
