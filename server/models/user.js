const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ROLES = ['student', 'teacher'];

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: { msg: 'Please enter a valid email address.' }
    }
  },
  passwordHash: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'password_hash'
  },
  role: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'student',
    validate: {
      isIn: [ROLES]
    }
  }
}, {
  tableName: 'users'
});

User.ROLES = ROLES;

module.exports = User;
