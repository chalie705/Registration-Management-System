exports.up = (knex) =>
  knex.schema.createTable('payments', (t) => {
    t.increments('id');
    t.integer('application_id').unsigned().notNullable().references('id').inTable('applications');
    t.integer('fee_id').unsigned().notNullable().references('id').inTable('fees');
    t.decimal('amount', 12, 2).notNullable();
    t.string('method', 30).notNullable();
    t.string('reference', 100).notNullable().unique();
    t.string('status', 20).notNullable().defaultTo('pending').index();
    t.integer('recorded_by').unsigned().references('id').inTable('users').onDelete('SET NULL');
    t.integer('confirmed_by').unsigned().references('id').inTable('users').onDelete('SET NULL');
    t.timestamp('confirmed_at');
    t.text('remarks');
    t.timestamps(true, true);
  });

exports.down = (knex) => knex.schema.dropTableIfExists('payments');
