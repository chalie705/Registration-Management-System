exports.up = (knex) =>
  knex.schema.createTable('application_status_history', (t) => {
    t.increments('id');
    t.integer('application_id').unsigned().notNullable().references('id').inTable('applications').onDelete('CASCADE');
    t.string('from_status', 30);
    t.string('to_status', 30).notNullable();
    t.integer('changed_by').unsigned().references('id').inTable('users').onDelete('SET NULL');
    t.text('remarks');
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });

exports.down = (knex) => knex.schema.dropTableIfExists('application_status_history');
