const { Lesson, Question, UserStats, UserProgress, sequelize } = require('../models');
const { HttpError, parseId } = require('../utils/http');
const { isAnswerCorrect, toAnswerMap } = require('../utils/grading');

const DAY_MS = 24 * 60 * 60 * 1000;

const todayString = () => new Date().toISOString().split('T')[0];

// Active yesterday -> streak continues; active today -> unchanged; longer gap -> restart at 1
const nextStreak = (currentStreak, lastActiveDate, today) => {
  if (!lastActiveDate) return 1;
  const diffDays = Math.round((Date.parse(today) - Date.parse(lastActiveDate)) / DAY_MS);
  if (diffDays === 0) return currentStreak;
  return diffDays === 1 ? currentStreak + 1 : 1;
};

// GET /api/lessons/:id (Protected)
// Correct answers are deliberately left out; answers are checked through the endpoint below.
exports.getLessonDetails = async (req, res) => {
  const lesson = await Lesson.findByPk(parseId(req.params.id), {
    include: [
      {
        model: Question,
        as: 'questions',
        attributes: ['id', 'type', 'questionText', 'options'],
      },
    ],
    order: [[{ model: Question, as: 'questions' }, 'id', 'ASC']],
  });

  if (!lesson) {
    throw new HttpError(404, 'Lesson not found.');
  }

  res.json(lesson);
};

// POST /api/lessons/:id/check (Protected) — instant feedback for one question
exports.checkAnswer = async (req, res) => {
  const lessonId = parseId(req.params.id);
  const questionId = parseId(req.body.questionId, 'question id');

  const question = await Question.findOne({ where: { id: questionId, lessonId } });
  if (!question) {
    throw new HttpError(404, 'Question not found in this lesson.');
  }

  res.json({
    correct: isAnswerCorrect(req.body.answer, [question.correctAnswer]),
    correctAnswer: question.correctAnswer,
  });
};

// POST /api/lessons/:id/submit (Protected)
exports.submitLesson = async (req, res) => {
  const userId = req.user.id;
  const answerMap = toAnswerMap(req.body.answers);

  const lesson = await Lesson.findByPk(parseId(req.params.id), {
    include: [{ model: Question, as: 'questions' }],
  });
  if (!lesson) {
    throw new HttpError(404, 'Lesson not found.');
  }
  if (lesson.questions.length === 0) {
    throw new HttpError(400, 'This lesson has no questions.');
  }

  let correctCount = 0;
  let wrongCount = 0;
  for (const question of lesson.questions) {
    if (!answerMap.has(question.id)) continue;
    if (isAnswerCorrect(answerMap.get(question.id), [question.correctAnswer])) {
      correctCount += 1;
    } else {
      wrongCount += 1;
    }
  }

  const totalQuestions = lesson.questions.length;
  const score = Math.round((correctCount / totalQuestions) * 100);

  const result = await sequelize.transaction(async (transaction) => {
    const stats = await UserStats.findOne({ where: { userId }, transaction });
    if (!stats) {
      throw new HttpError(404, 'User stats not found.');
    }

    // Lose 1 heart per wrong answer; the lesson fails if hearts run out before everything is right
    const heartsLeft = Math.max(0, stats.hearts - wrongCount);
    const failed = heartsLeft === 0 && correctCount < totalQuestions;

    // 10 XP for completing + 2 XP per correct answer; a small consolation of 1 XP per correct answer on failure
    const xpGained = failed ? correctCount : 10 + correctCount * 2;

    const today = todayString();
    stats.xp += xpGained;
    stats.hearts = heartsLeft;
    stats.streakCount = nextStreak(stats.streakCount, stats.lastActiveDate, today);
    stats.lastActiveDate = today;
    await stats.save({ transaction });

    if (!failed) {
      await UserProgress.create({ userId, lessonId: lesson.id, score }, { transaction });
    }

    return {
      success: !failed,
      score,
      correctCount,
      totalQuestions,
      xpGained,
      heartsLeft,
      heartsLost: wrongCount,
      streakCount: stats.streakCount,
    };
  });

  res.json(result);
};
