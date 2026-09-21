const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const QUESTION_TYPES = ['multiple-choice', 'short-answer'];

const TestQuestion = sequelize.define('TestQuestion', {
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
  orderIndex: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'order_index'
  },
  type: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      isIn: [QUESTION_TYPES]
    }
  },
  questionText: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'question_text'
  },
  options: {
    // Choices for multiple-choice questions, e.g. ["Hola", "Adiós"]; null for short answer
    type: DataTypes.JSON,
    allowNull: true
  },
  correctAnswers: {
    // Multiple choice: [the correct option]. Short answer: every accepted spelling.
    type: DataTypes.JSON,
    allowNull: false,
    field: 'correct_answers'
  },
  points: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  }
}, {
  tableName: 'test_questions'
});

TestQuestion.TYPES = QUESTION_TYPES;

module.exports = TestQuestion;
