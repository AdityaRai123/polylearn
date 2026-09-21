const sequelize = require('../config/db');
const User = require('./user');
const Language = require('./language');
const Unit = require('./unit');
const Lesson = require('./lesson');
const Question = require('./question');
const UserProgress = require('./userProgress');
const UserStats = require('./userStats');
const Test = require('./test');
const TestQuestion = require('./testQuestion');
const TestAttempt = require('./testAttempt');

// Associations

// User <-> UserStats (One-to-One)
User.hasOne(UserStats, { foreignKey: 'userId', as: 'stats', onDelete: 'CASCADE' });
UserStats.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User <-> UserProgress (One-to-Many)
User.hasMany(UserProgress, { foreignKey: 'userId', as: 'progress', onDelete: 'CASCADE' });
UserProgress.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Language <-> Unit (One-to-Many)
Language.hasMany(Unit, { foreignKey: 'languageId', as: 'units', onDelete: 'CASCADE' });
Unit.belongsTo(Language, { foreignKey: 'languageId', as: 'language' });

// Unit <-> Lesson (One-to-Many)
Unit.hasMany(Lesson, { foreignKey: 'unitId', as: 'lessons', onDelete: 'CASCADE' });
Lesson.belongsTo(Unit, { foreignKey: 'unitId', as: 'unit' });

// Lesson <-> Question (One-to-Many)
Lesson.hasMany(Question, { foreignKey: 'lessonId', as: 'questions', onDelete: 'CASCADE' });
Question.belongsTo(Lesson, { foreignKey: 'lessonId', as: 'lesson' });

// Lesson <-> UserProgress (One-to-Many)
Lesson.hasMany(UserProgress, { foreignKey: 'lessonId', as: 'progress', onDelete: 'CASCADE' });
UserProgress.belongsTo(Lesson, { foreignKey: 'lessonId', as: 'lesson' });

// Teacher (User) <-> Test (One-to-Many)
User.hasMany(Test, { foreignKey: 'teacherId', as: 'tests', onDelete: 'CASCADE' });
Test.belongsTo(User, { foreignKey: 'teacherId', as: 'teacher' });

// Test <-> TestQuestion (One-to-Many)
Test.hasMany(TestQuestion, { foreignKey: 'testId', as: 'questions', onDelete: 'CASCADE' });
TestQuestion.belongsTo(Test, { foreignKey: 'testId', as: 'test' });

// Test <-> TestAttempt (One-to-Many)
Test.hasMany(TestAttempt, { foreignKey: 'testId', as: 'attempts', onDelete: 'CASCADE' });
TestAttempt.belongsTo(Test, { foreignKey: 'testId', as: 'test' });

// Student (User) <-> TestAttempt (One-to-Many)
User.hasMany(TestAttempt, { foreignKey: 'userId', as: 'testAttempts', onDelete: 'CASCADE' });
TestAttempt.belongsTo(User, { foreignKey: 'userId', as: 'student' });

module.exports = {
  sequelize,
  User,
  Language,
  Unit,
  Lesson,
  Question,
  UserProgress,
  UserStats,
  Test,
  TestQuestion,
  TestAttempt
};
