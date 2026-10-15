exports.up = (knex) =>
  knex.schema.createTable('applicants', (t) => {
    t.increments('id');
    t.integer('user_id').unsigned().notNullable().unique().references('id').inTable('users').onDelete('CASCADE');
    t.date('date_of_birth');
    t.string('gender', 20);
    t.string('national_id', 50);
    t.string('address', 255);
    t.string('city', 100);
    t.string('country', 100);
    t.timestamps(true, true);
  });

exports.down = (knex) => knex.schema.dropTableIfExists('applicants');
