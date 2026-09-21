const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const TestAttempt = sequelize.define('TestAttempt', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  testId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'test_id'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id'
  },
  score: {
    // Percentage of points earned, 0-100
    type: DataTypes.INTEGER,
    allowNull: false
  },
  pointsEarned: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'points_earned'
  },
  pointsPossible: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'points_possible'
  },
  correctCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'correct_count'
  },
  totalQuestions: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'total_questions'
  },
  review: {
    // Snapshot of each question, the student's answer and the correct answer at submission time
    type: DataTypes.JSON,
    allowNull: false
  }
}, {
  tableName: 'test_attempts',
  indexes: [
    // One attempt per student per test (a teacher can reset it to allow a retake)
    { unique: true, fields: ['test_id', 'user_id'] }
  ]
});

module.exports = TestAttempt;
