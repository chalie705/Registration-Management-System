exports.up = (knex) =>
  knex.schema.createTable('applications', (t) => {
    t.increments('id');
    t.string('application_no', 30).unique();
    t.integer('applicant_id').unsigned().notNullable().references('id').inTable('applicants');
    t.integer('program_id').unsigned().notNullable().references('id').inTable('programs');
    t.integer('period_id').unsigned().notNullable().references('id').inTable('registration_periods');
    t.string('status', 30).notNullable().defaultTo('draft').index();
    t.text('statement');
    t.timestamp('submitted_at');
    t.timestamp('decided_at');
    t.integer('decided_by').unsigned().references('id').inTable('users').onDelete('SET NULL');
    t.text('decision_remarks');
    t.timestamps(true, true);
  });

exports.down = (knex) => knex.schema.dropTableIfExists('applications');
