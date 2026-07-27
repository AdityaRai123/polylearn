const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Lesson = sequelize.define('Lesson', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  unitId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'unit_id'
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
  tableName: 'lessons'
});

module.exports = Lesson;
