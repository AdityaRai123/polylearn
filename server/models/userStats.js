const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const UserStats = sequelize.define('UserStats', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    field: 'user_id'
  },
  xp: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  streakCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'streak_count'
  },
  lastActiveDate: {
    type: DataTypes.DATEONLY, // Date-only comparison is essential for daily streak counters
    allowNull: true,
    field: 'last_active_date'
  },
  hearts: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 5,
    validate: {
      min: 0,
      max: 5
    }
  }
}, {
  tableName: 'user_stats'
});

module.exports = UserStats;
