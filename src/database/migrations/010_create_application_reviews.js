exports.up = (knex) =>
  knex.schema.createTable('application_reviews', (t) => {
    t.increments('id');
    t.integer('application_id').unsigned().notNullable().references('id').inTable('applications').onDelete('CASCADE');
    t.integer('reviewer_id').unsigned().notNullable().references('id').inTable('users');
    t.string('decision', 30).notNullable();
    t.integer('score');
    t.text('comments');
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });

exports.down = (knex) => knex.schema.dropTableIfExists('application_reviews');
