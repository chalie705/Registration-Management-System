exports.up = (knex) =>
  knex.schema.createTable('programs', (t) => {
    t.increments('id');
    t.string('code', 20).notNullable().unique();
    t.string('name', 150).notNullable();
    t.text('description');
    t.decimal('tuition_fee', 12, 2).notNullable().defaultTo(0);
    t.integer('capacity').notNullable().defaultTo(0);
    t.boolean('is_active').notNullable().defaultTo(true);
    t.timestamps(true, true);
  });

exports.down = (knex) => knex.schema.dropTableIfExists('programs');
