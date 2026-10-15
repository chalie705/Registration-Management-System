exports.up = (knex) =>
  knex.schema.createTable('users', (t) => {
    t.increments('id');
    t.integer('role_id').unsigned().notNullable().references('id').inTable('roles');
    t.string('full_name', 150).notNullable();
    t.string('email', 150).notNullable().unique();
    t.string('phone', 30);
    t.string('password_hash', 255).notNullable();
    t.boolean('is_active').notNullable().defaultTo(true);
    t.timestamp('last_login_at');
    t.timestamps(true, true);
  });

exports.down = (knex) => knex.schema.dropTableIfExists('users');
