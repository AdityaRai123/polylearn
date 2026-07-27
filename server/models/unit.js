const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Unit = sequelize.define('Unit', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  languageId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'language_id'
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  orderIndex: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'order_index'
  }
}, {
  tableName: 'units'
});

module.exports = Unit;
