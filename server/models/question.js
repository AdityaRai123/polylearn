const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Question = sequelize.define('Question', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  lessonId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'lesson_id'
  },
  type: {
    type: DataTypes.ENUM('multiple-choice', 'fill-in-the-blank'),
    allowNull: false
  },
  questionText: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'question_text'
  },
  options: {
    type: DataTypes.JSON, // stores choices for MC as an array of strings e.g. ["hello", "bye", ...]
    allowNull: true
  },
  correctAnswer: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'correct_answer'
  }
}, {
  tableName: 'questions'
});

module.exports = Question;
