const bcrypt = require('bcryptjs');
const {
  User, UserStats, UserProgress, Language, Unit, Lesson, Question, Test, TestQuestion, TestAttempt
} = require('../models');
const { prepareDatabase } = require('../config/bootstrap');
const { gradeTest } = require('../utils/grading');

// Inserts demo languages, lessons, users and a sample teacher test into an empty database
const seedContent = async () => {
  try {
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

    await UserStats.create({
      userId: student.id,
      xp: 45,
      streakCount: 3,
      lastActiveDate: new Date().toISOString().split('T')[0],
      hearts: 4
    });

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

    // 5. Seed a demo teacher with a published test
    console.log('Seeding teacher and sample test...');
    const teacherHash = await bcrypt.hash('teacher123', salt);
    const teacher = await User.create({
      name: 'Ms. Rivera',
      email: 'teacher@polylearn.com',
      passwordHash: teacherHash,
      role: 'teacher'
    });

    const spanishQuiz = await Test.create({
      teacherId: teacher.id,
      title: 'Spanish Basics Quiz',
      description: 'Greetings, pronouns and a few everyday verbs. You get one attempt, so take your time.',
      isPublished: true
    });

    const quizQuestions = await TestQuestion.bulkCreate([
      {
        testId: spanishQuiz.id,
        orderIndex: 0,
        type: 'multiple-choice',
        questionText: 'Which phrase means "Good night"?',
        options: ['Buenos días', 'Buenas tardes', 'Buenas noches', 'Hola'],
        correctAnswers: ['Buenas noches'],
        points: 1
      },
      {
        testId: spanishQuiz.id,
        orderIndex: 1,
        type: 'multiple-choice',
        questionText: 'What is the Spanish word for "We"?',
        options: ['Ellos', 'Nosotros', 'Ustedes', 'Yo'],
        correctAnswers: ['Nosotros'],
        points: 1
      },
      {
        testId: spanishQuiz.id,
        orderIndex: 2,
        type: 'short-answer',
        questionText: 'Translate "Thank you very much" into Spanish.',
        options: null,
        correctAnswers: ['Muchas gracias'],
        points: 2
      },
      {
        testId: spanishQuiz.id,
        orderIndex: 3,
        type: 'short-answer',
        questionText: 'Translate the verb "to live" into Spanish.',
        options: null,
        correctAnswers: ['Vivir'],
        points: 2
      }
    ], { returning: true });

    await Test.create({
      teacherId: teacher.id,
      title: 'French Greetings (draft)',
      description: 'Work in progress — students cannot see drafts until you publish them.',
      isPublished: false
    });

    // Carlos has already taken the Spanish quiz, so the teacher's results page has data
    const carlosAnswers = new Map([
      [quizQuestions[0].id, 'Buenas noches'],
      [quizQuestions[1].id, 'Ellos'],
      [quizQuestions[2].id, 'muchas gracias'],
      [quizQuestions[3].id, 'Vivir']
    ]);
    const { review, ...summary } = gradeTest(quizQuestions, carlosAnswers);
    await TestAttempt.create({ testId: spanishQuiz.id, userId: secondUser.id, ...summary, review });

    console.log('Seeding completed successfully!');
  } catch (err) {
    console.error('Seeding failed:', err);
    throw err;
  }
};

// `npm run seed`: drop every table, recreate them and insert the demo content
const seedDatabase = async () => {
  await prepareDatabase({ reset: true });
  await seedContent();
};

// Called on server start, after the database has been prepared
const autoSeedIfEmpty = async () => {
  try {
    const count = await Language.count();
    if (count === 0) {
      console.log('Database is empty. Running auto-seeder for initial content...');
      await seedContent();
      console.log('Auto-seeding completed.');
    }
  } catch (err) {
    console.error('Auto-seed check failed:', err);
  }
};

if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { seedDatabase, autoSeedIfEmpty };

