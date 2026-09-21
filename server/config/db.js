const path = require('path');
const { Sequelize } = require('sequelize');
const { db } = require('./env');

const define = {
  timestamps: true,
  underscored: true,
};

let sequelize;

if (db.url) {
  // Hosted database connection string (e.g. Postgres on Neon/Render/Supabase, or MySQL)
  sequelize = new Sequelize(db.url, {
    logging: false,
    define,
    dialectOptions: db.ssl ? { ssl: { require: true, rejectUnauthorized: false } } : {},
  });
  console.log(`Sequelize configured with DATABASE_URL (${sequelize.getDialect()}).`);
} else if (db.dialect === 'sqlite') {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.resolve(__dirname, '../database.sqlite'),
    logging: false,
    define,
  });
  console.log('Sequelize configured with SQLite storage.');
} else {
  sequelize = new Sequelize(db.name, db.user, db.pass, {
    host: db.host,
    port: db.port,
    dialect: 'mysql',
    logging: false,
    define,
  });
  console.log('Sequelize configured with MySQL client.');
}

module.exports = sequelize;
