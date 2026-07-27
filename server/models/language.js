const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Language = sequelize.define('Language', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  code: {
    type: DataTypes.STRING(10),
    allowNull: false,
    unique: true
  }
}, {
  tableName: 'languages'
});

module.exports = Language;
