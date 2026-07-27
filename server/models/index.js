const sequelize = require('../config/db');
const User = require('./user');
const Language = require('./language');
const Unit = require('./unit');
const Lesson = require('./lesson');
const Question = require('./question');
const UserProgress = require('./userProgress');
const UserStats = require('./userStats');

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

module.exports = {
  sequelize,
  User,
  Language,
  Unit,
  Lesson,
  Question,
  UserProgress,
  UserStats
};
