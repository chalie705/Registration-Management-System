exports.up = (knex) =>
  knex.schema.createTable('roles', (t) => {
    t.increments('id');
    t.string('name', 50).notNullable().unique();
    t.string('description', 255);
    t.timestamps(true, true);
  });

exports.down = (knex) => knex.schema.dropTableIfExists('roles');
