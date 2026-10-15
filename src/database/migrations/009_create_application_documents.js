exports.up = (knex) =>
  knex.schema.createTable('application_documents', (t) => {
    t.increments('id');
    t.integer('application_id').unsigned().notNullable().references('id').inTable('applications').onDelete('CASCADE');
    t.string('doc_type', 50).notNullable().defaultTo('other');
    t.string('file_name', 255).notNullable();
    t.string('file_path', 500).notNullable();
    t.string('mime_type', 100);
    t.integer('size_bytes');
    t.integer('uploaded_by').unsigned().references('id').inTable('users').onDelete('SET NULL');
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });

exports.down = (knex) => knex.schema.dropTableIfExists('application_documents');
