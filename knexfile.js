require('dotenv').config();

module.exports = {
  development: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST || '127.0.0.1',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'student_registration_db',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD !== undefined ? String(process.env.DB_PASSWORD) : '1234',
    },
    pool: {
      afterCreate: (conn, done) => {
        conn.query('SET search_path TO rms, public;', (err) => {
          done(err, conn);
        });
      },
    },
    migrations: {
      directory: './src/database/migrations',
    },
    seeds: {
      directory: './src/database/seeds',
    },
  },
};