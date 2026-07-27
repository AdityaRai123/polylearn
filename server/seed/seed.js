const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
const path = require('path');
const { sequelize, User, UserStats, UserProgress, Language, Unit, Lesson, Question } = require('../models');

// Load env vars
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const seedDatabase = async () => {
  try {
    if (process.env.DB_DIALECT !== 'sqlite') {
      console.log('Ensuring database exists...');
      const connection = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || '',
      });
      await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'polylearn'}\`;`);
      await connection.end();
      console.log('Database check complete.');
    } else {
      console.log('Using SQLite. Skipping MySQL database existence check.');
    }

    console.log('Connecting to database for seeding...');
    await sequelize.authenticate();
    console.log('Database connected.');

    // Force sync drops all tables and recreates them
    console.log('Resetting tables...');
    await sequelize.sync({ force: true });
    console.log('Tables reset.');

    // 1. Seed Languages
    console.log('Seeding languages...');
    const spanish = await Language.create({ name: 'Spanish', code: 'es' });
    const french = await Language.create({ name: 'French', code: 'fr' });
    const japanese = await Language.create({ name: 'Japanese', code: 'ja' });

    // 2. Seed Units
    console.log('Seeding units...');
    // Spanish Units
    const esUnit1 = await Unit.create({ languageId: spanish.id, title: 'Basics & Greetings', orderIndex: 1 });
    const esUnit2 = await Unit.create({ languageId: spanish.id, title: 'Common Phrases & Verbs', orderIndex: 2 });
    
    // French Units
    const frUnit1 = await Unit.create({ languageId: french.id, title: 'Basics 1', orderIndex: 1 });
    
    // Japanese Units
    const jaUnit1 = await Unit.create({ languageId: japanese.id, title: 'Greetings & Introduction', orderIndex: 1 });

    // 3. Seed Lessons & Questions
    console.log('Seeding lessons and questions...');
    
    // --- SPANISH UNIT 1 ---
    const esLesson1 = await Lesson.create({ unitId: esUnit1.id, title: 'Greetings', orderIndex: 1 });
    await Question.bulkCreate([
      {
        lessonId: esLesson1.id,
        type: 'multiple-choice',
        questionText: 'How do you say "Hello" in Spanish?',
        options: ['Hola', 'Adiós', 'Gracias', 'Por favor'],
        correctAnswer: 'Hola'
      },
      {
        lessonId: esLesson1.id,
        type: 'multiple-choice',
        questionText: 'Which phrase means "Good morning"?',
        options: ['Buenas noches', 'Hola', 'Buenos días', 'Hasta luego'],
        correctAnswer: 'Buenos días'
      },
      {
        lessonId: esLesson1.id,
        type: 'fill-in-the-blank',
        questionText: 'Translate the word "Thank you" into Spanish:',
        options: null,
        correctAnswer: 'Gracias'
      }
    ]);

    const esLesson2 = await Lesson.create({ unitId: esUnit1.id, title: 'Personal Pronouns', orderIndex: 2 });
    await Question.bulkCreate([
      {
        lessonId: esLesson2.id,
        type: 'multiple-choice',
        questionText: 'What is the Spanish word for "I"?',
        options: ['Tú', 'Yo', 'Él', 'Nosotros'],
        correctAnswer: 'Yo'
      },
      {
        lessonId: esLesson2.id,
        type: 'multiple-choice',
        questionText: 'Which word means "She" in Spanish?',
        options: ['Él', 'Ella', 'Ellos', 'Nosotros'],
        correctAnswer: 'Ella'
      },
      {
        lessonId: esLesson2.id,
        type: 'fill-in-the-blank',
        questionText: 'Translate "You" (informal singular) into Spanish:',
        options: null,
        correctAnswer: 'Tú'
      }
    ]);

    // --- SPANISH UNIT 2 ---
    const esLesson3 = await Lesson.create({ unitId: esUnit2.id, title: 'Common Verbs', orderIndex: 1 });
    await Question.bulkCreate([
      {
        lessonId: esLesson3.id,
        type: 'multiple-choice',
        questionText: 'How do you say "To speak" in Spanish?',
        options: ['Hablar', 'Comer', 'Vivir', 'Escribir'],
        correctAnswer: 'Hablar'
      },
      {
        lessonId: esLesson3.id,
        type: 'multiple-choice',
        questionText: 'How do you say "To drink" in Spanish?',
        options: ['Beber', 'Comer', 'Correr', 'Leer'],
        correctAnswer: 'Beber'
      },
      {
        lessonId: esLesson3.id,
        type: 'fill-in-the-blank',
        questionText: 'Translate "To eat" into Spanish:',
        options: null,
        correctAnswer: 'Comer'
      }
    ]);

    // --- FRENCH UNIT 1 ---
    const frLesson1 = await Lesson.create({ unitId: frUnit1.id, title: 'Greetings', orderIndex: 1 });
    await Question.bulkCreate([
      {
        lessonId: frLesson1.id,
        type: 'multiple-choice',
        questionText: 'How do you say "Hello / Good morning" in French?',
        options: ['Bonjour', 'Au revoir', 'Merci', 'S\'il vous plaît'],
        correctAnswer: 'Bonjour'
      },
      {
        lessonId: frLesson1.id,
        type: 'multiple-choice',
        questionText: 'What does "Au revoir" mean in English?',
        options: ['Hello', 'Please', 'Thank you', 'Goodbye'],
        correctAnswer: 'Goodbye'
      },
      {
        lessonId: frLesson1.id,
        type: 'fill-in-the-blank',
        questionText: 'Translate the word "Thank you" into French:',
        options: null,
        correctAnswer: 'Merci'
      }
    ]);

    const frLesson2 = await Lesson.create({ unitId: frUnit1.id, title: 'Basic Words', orderIndex: 2 });
    await Question.bulkCreate([
      {
        lessonId: frLesson2.id,
        type: 'multiple-choice',
        questionText: 'How do you say "Yes" in French?',
        options: ['Non', 'Oui', 'Salut', 'Merci'],
        correctAnswer: 'Oui'
      },
      {
        lessonId: frLesson2.id,
        type: 'fill-in-the-blank',
        questionText: 'Translate the word "No" into French:',
        options: null,
        correctAnswer: 'Non'
      }
    ]);

    // --- JAPANESE UNIT 1 ---
    const jaLesson1 = await Lesson.create({ unitId: jaUnit1.id, title: 'Basic Greetings', orderIndex: 1 });
    await Question.bulkCreate([
      {
        lessonId: jaLesson1.id,
        type: 'multiple-choice',
        questionText: 'How do you write "Hello" in Japanese?',
        options: ['こんにちは (Konnichiwa)', 'ありがとう (Arigatou)', 'さようなら (Sayounara)', 'おはよう (Ohayou)'],
        correctAnswer: 'こんにちは (Konnichiwa)'
      },
      {
        lessonId: jaLesson1.id,
        type: 'multiple-choice',
        questionText: 'Which phrase is used for "Thank you"?',
        options: ['おはよう (Ohayou)', 'はい (Hai)', 'ありがとう (Arigatou)', 'すみません (Sumimasen)'],
        correctAnswer: 'ありがとう (Arigatou)'
      },
      {
        lessonId: jaLesson1.id,
        type: 'fill-in-the-blank',
        questionText: 'Translate "Yes" in Japanese (write Hiragana or Romaji e.g., "はい" or "Hai"):',
        options: null,
        correctAnswer: 'はい (Hai)'
      }
    ]);

    // 4. Seed Test Users
    console.log('Seeding users...');
    const salt = await bcrypt.genSalt(10);
    const passHash = await bcrypt.hash('password123', salt);
    const demoHash = await bcrypt.hash('demo123', salt);

    // Create student user (has completed Spanish Greetings)
    const student = await User.create({
      name: 'Test Student',
      email: 'student@polylearn.com',
      passwordHash: passHash
    });

    const studentStats = await UserStats.create({
      userId: student.id,
      xp: 45,
      streakCount: 3,
      lastActiveDate: new Date().toISOString().split('T')[0], // Active today
      hearts: 4
    });

    // Seed progress: completed Spanish Lesson 1
    await UserProgress.create({
      userId: student.id,
      lessonId: esLesson1.id,
      score: 100
    });

    // Create demo user (fresh start)
    const demoUser = await User.create({
      name: 'College Demo User',
      email: 'demo@polylearn.com',
      passwordHash: demoHash
    });

    await UserStats.create({
      userId: demoUser.id,
      xp: 0,
      streakCount: 0,
      lastActiveDate: null,
      hearts: 5
    });

    // Add another top user for the leaderboard to look realistic
    const topUser = await User.create({
      name: 'Polyglot Guru',
      email: 'guru@polylearn.com',
      passwordHash: passHash
    });

    await UserStats.create({
      userId: topUser.id,
      xp: 450,
      streakCount: 15,
      lastActiveDate: new Date().toISOString().split('T')[0],
      hearts: 5
    });

    await UserProgress.create({ userId: topUser.id, lessonId: esLesson1.id, score: 100 });
    await UserProgress.create({ userId: topUser.id, lessonId: esLesson2.id, score: 100 });
    await UserProgress.create({ userId: topUser.id, lessonId: esLesson3.id, score: 100 });
    await UserProgress.create({ userId: topUser.id, lessonId: frLesson1.id, score: 100 });

    const secondUser = await User.create({
      name: 'Carlos Ruiz',
      email: 'carlos@polylearn.com',
      passwordHash: passHash
    });

    await UserStats.create({
      userId: secondUser.id,
      xp: 120,
      streakCount: 5,
      lastActiveDate: new Date().toISOString().split('T')[0],
      hearts: 3
    });

    await UserProgress.create({ userId: secondUser.id, lessonId: esLesson1.id, score: 100 });
    await UserProgress.create({ userId: secondUser.id, lessonId: esLesson2.id, score: 90 });

    console.log('Seeding completed successfully!');
    process.exit(0);

  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
};

seedDatabase();
