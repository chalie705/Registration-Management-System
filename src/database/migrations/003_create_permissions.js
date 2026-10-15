exports.up = async (knex) => {
  await knex.schema.createTable('permissions', (t) => {
    t.increments('id');
    t.string('code', 80).notNullable().unique();
    t.string('description', 255);
  });

  await knex.schema.createTable('role_permissions', (t) => {
    t.integer('role_id').unsigned().notNullable().references('id').inTable('roles').onDelete('CASCADE');
    t.integer('permission_id').unsigned().notNullable().references('id').inTable('permissions').onDelete('CASCADE');
    t.primary(['role_id', 'permission_id']);
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('role_permissions');
  await knex.schema.dropTableIfExists('permissions');
};
