const pg = require('pg');
const knex = require('knex');
const knexConfig = require('../../knexfile');
const { nodeEnv, db: dbCfg } = require('./env');

// DATE columns stay as 'YYYY-MM-DD' strings, NUMERIC columns become numbers
pg.types.setTypeParser(1082, (v) => v);
pg.types.setTypeParser(1700, parseFloat);

const db = knex(knexConfig[nodeEnv]);

async function connectDB() {
  await db.raw('CREATE SCHEMA IF NOT EXISTS ??', [dbCfg.schema]);
  const result = await db.raw('SELECT current_database() AS db, current_schema() AS schema');
  const { db: dbName, schema } = result.rows[0];
  console.log(`✅ Database connected: ${dbName} (schema: ${schema})`);
}

module.exports = { db, connectDB };