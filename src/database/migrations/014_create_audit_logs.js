exports.up = (knex) =>
  knex.schema.createTable('audit_logs', (t) => {
    t.increments('id');
    t.integer('user_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
    t.string('action', 80).notNullable().index();
    t.string('entity', 80).notNullable().index();
    t.integer('entity_id');
    t.string('ip_address', 64);
    t.string('user_agent', 255);
    t.jsonb('details');
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });

exports.down = (knex) => knex.schema.dropTableIfExists('audit_logs');
