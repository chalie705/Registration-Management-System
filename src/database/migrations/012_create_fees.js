exports.up = (knex) =>
  knex.schema.createTable('fees', (t) => {
    t.increments('id');
    t.integer('program_id').unsigned().references('id').inTable('programs').onDelete('CASCADE');
    t.string('name', 150).notNullable();
    t.decimal('amount', 12, 2).notNullable();
    t.date('due_date');
    t.boolean('is_active').notNullable().defaultTo(true);
    t.timestamps(true, true);
  });

exports.down = (knex) => knex.schema.dropTableIfExists('fees');
