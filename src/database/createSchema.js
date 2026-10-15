const knex = require('knex');
const { db } = require('../config/env');

(async () => {
  const k = knex({
    client: 'pg',
    connection: {
      host: db.host,
      port: db.port,
      database: db.database,
      user: db.user,
      password: db.password,
    },
  });
  await k.raw('CREATE SCHEMA IF NOT EXISTS ??', [db.schema]);
  console.log(`✅ Schema "${db.schema}" ready in database "${db.database}"`);
  await k.destroy();
})().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});