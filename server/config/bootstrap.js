const mysql = require('mysql2/promise');
const { DataTypes } = require('sequelize');
const { db } = require('./env');
const { sequelize } = require('../models');

// MySQL refuses to connect to a database that doesn't exist yet, so create it first.
const ensureMysqlDatabase = async () => {
  if (db.url || db.dialect !== 'mysql') return;

  const connection = await mysql.createConnection({
    host: db.host,
    port: db.port,
    user: db.user,
    password: db.pass,
  });
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${db.name}\`;`);
  await connection.end();
};

// sync() creates missing tables but never adds columns to tables that already exist,
// so columns introduced after a database was first created are added here.
const addMissingColumns = async () => {
  const queryInterface = sequelize.getQueryInterface();
  const userColumns = await queryInterface.describeTable('users');

  if (!userColumns.role) {
    await queryInterface.addColumn('users', 'role', {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'student',
    });
    console.log('Added missing users.role column.');
  }
};

const prepareDatabase = async ({ reset = false } = {}) => {
  await ensureMysqlDatabase();
  await sequelize.authenticate();
  console.log(`Database connection established (${sequelize.getDialect()}).`);

  await sequelize.sync({ force: reset });
  if (!reset) {
    await addMissingColumns();
  }
  console.log('Database models synced.');
};

module.exports = { prepareDatabase };
