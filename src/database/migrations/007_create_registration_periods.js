exports.up = (knex) =>
  knex.schema.createTable('registration_periods', (t) => {
    t.increments('id');
    t.string('name', 150).notNullable();
    t.string('academic_year', 20).notNullable();
    t.date('start_date').notNullable();
    t.date('end_date').notNullable();
    t.boolean('is_open').notNullable().defaultTo(true);
    t.integer('created_by').unsigned().references('id').inTable('users').onDelete('SET NULL');
    t.timestamps(true, true);
  });

exports.down = (knex) => knex.schema.dropTableIfExists('registration_periods');
