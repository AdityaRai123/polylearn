const { Sequelize } = require('sequelize');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

let sequelize;

if (process.env.DB_DIALECT === 'sqlite') {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.resolve(__dirname, '../database.sqlite'),
    logging: false,
    define: {
      timestamps: true,
      underscored: true
    }
  });
  console.log('Sequelize configured with SQLite storage.');
} else {
  sequelize = new Sequelize(
    process.env.DB_NAME || 'polylearn',
    process.env.DB_USER || 'root',
    process.env.DB_PASS || '',
    {
      host: process.env.DB_HOST || '127.0.0.1',
      port: process.env.DB_PORT || 3306,
      dialect: 'mysql',
      logging: false,
      define: {
        timestamps: true,
        underscored: true
      }
    }
  );
  console.log('Sequelize configured with MySQL client.');
}

module.exports = sequelize;
