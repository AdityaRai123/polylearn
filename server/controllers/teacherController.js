const { Test, TestQuestion, TestAttempt, User, sequelize } = require('../models');
const { HttpError, parseId } = require('../utils/http');
const { normalizeAnswer } = require('../utils/grading');
const { formatAttempt } = require('./testController');

const MAX_QUESTIONS = 100;
const MAX_OPTIONS = 6;
const MAX_ACCEPTED_ANSWERS = 10;

const cleanText = (value) => (typeof value === 'string' ? value.trim() : '');

const questionsOrder = [[{ model: TestQuestion, as: 'questions' }, 'orderIndex', 'ASC']];

const findOwnTest = async (req, options = {}) => {
  const test = await Test.findOne({
    where: { id: parseId(req.params.id), teacherId: req.user.id },
    ...options,
  });
  if (!test) {
    throw new HttpError(404, 'Test not found.');
  }
  return test;
};

const validateQuestion = (question, index) => {
  const label = `Question ${index + 1}`;
  const type = question?.type;
  const questionText = cleanText(question?.questionText);
  const points = question?.points === undefined ? 1 : Number(question.points);

  if (!TestQuestion.TYPES.includes(type)) {
    throw new HttpError(400, `${label}: choose a question type.`);
  }
  if (!questionText) {
    throw new HttpError(400, `${label}: enter the question text.`);
  }
  if (questionText.length > 1000) {
    throw new HttpError(400, `${label}: question text must be 1000 characters or fewer.`);
  }
  if (!Number.isInteger(points) || points < 1 || points > 100) {
    throw new HttpError(400, `${label}: points must be a whole number from 1 to 100.`);
  }

  if (type === 'multiple-choice') {
    const options = Array.isArray(question.options) ? question.options.map(cleanText) : [];
    const correctAnswer = cleanText(question.correctAnswer);

    if (options.length < 2 || options.length > MAX_OPTIONS) {
      throw new HttpError(400, `${label}: add between 2 and ${MAX_OPTIONS} options.`);
    }
    if (options.some((option) => !option || option.length > 200)) {
      throw new HttpError(400, `${label}: options can't be empty or longer than 200 characters.`);
    }
    if (new Set(options.map(normalizeAnswer)).size !== options.length) {
      throw new HttpError(400, `${label}: each option must be different.`);
    }
    if (!options.includes(correctAnswer)) {
      throw new HttpError(400, `${label}: mark which option is correct.`);
    }

    return { type, questionText, options, correctAnswers: [correctAnswer], points, orderIndex: index };
  }

  // Short answer: keep each distinct accepted spelling
  const acceptedAnswers = [];
  const seen = new Set();
  for (const answer of Array.isArray(question.acceptedAnswers) ? question.acceptedAnswers : []) {
    const text = cleanText(answer);
    if (text && !seen.has(normalizeAnswer(text))) {
      seen.add(normalizeAnswer(text));
      acceptedAnswers.push(text.slice(0, 200));
    }
  }
  if (acceptedAnswers.length === 0) {
    throw new HttpError(400, `${label}: add at least one accepted answer.`);
  }
  if (acceptedAnswers.length > MAX_ACCEPTED_ANSWERS) {
    throw new HttpError(400, `${label}: add at most ${MAX_ACCEPTED_ANSWERS} accepted answers.`);
  }

  return { type, questionText, options: null, correctAnswers: acceptedAnswers, points, orderIndex: index };
};

const validateTestPayload = (body) => {
  const title = cleanText(body.title);
  const description = cleanText(body.description);
  const isPublished = body.isPublished === true;

  if (!title) {
    throw new HttpError(400, 'Give the test a title.');
  }
  if (title.length > 150) {
    throw new HttpError(400, 'Title must be 150 characters or fewer.');
  }
  if (description.length > 2000) {
    throw new HttpError(400, 'Description must be 2000 characters or fewer.');
  }
  if (!Array.isArray(body.questions)) {
    throw new HttpError(400, 'Questions must be sent as an array.');
  }
  if (body.questions.length > MAX_QUESTIONS) {
    throw new HttpError(400, `A test can have at most ${MAX_QUESTIONS} questions.`);
  }
  if (isPublished && body.questions.length === 0) {
    throw new HttpError(400, 'Add at least one question before publishing.');
  }

  return {
    title,
    description: description || null,
    isPublished,
    questions: body.questions.map(validateQuestion),
  };
};

const formatTeacherTest = (test, attemptCount) => ({
  id: test.id,
  title: test.title,
  description: test.description,
  isPublished: test.isPublished,
  createdAt: test.createdAt,
  updatedAt: test.updatedAt,
  attemptCount,
  questions: test.questions.map((q) => ({
    id: q.id,
    type: q.type,
    questionText: q.questionText,
    options: q.options,
    correctAnswers: q.correctAnswers,
    points: q.points,
  })),
});

const loadTeacherTest = async (testId) => {
  const [test, attemptCount] = await Promise.all([
    Test.findByPk(testId, { include: [{ model: TestQuestion, as: 'questions' }], order: questionsOrder }),
    TestAttempt.count({ where: { testId } }),
  ]);
  return formatTeacherTest(test, attemptCount);
};

// GET /api/teacher/tests
exports.listTests = async (req, res) => {
  const tests = await Test.findAll({
    where: { teacherId: req.user.id },
    include: [{ model: TestQuestion, as: 'questions', attributes: ['id', 'points'] }],
    order: [['updatedAt', 'DESC']],
  });

  const attempts = tests.length
    ? await TestAttempt.findAll({
        where: { testId: tests.map((t) => t.id) },
        attributes: ['testId', 'score'],
      })
    : [];

  const scoresByTest = new Map();
  for (const attempt of attempts) {
    if (!scoresByTest.has(attempt.testId)) scoresByTest.set(attempt.testId, []);
    scoresByTest.get(attempt.testId).push(attempt.score);
  }

  res.json(
    tests.map((test) => {
      const scores = scoresByTest.get(test.id) || [];
      return {
        id: test.id,
        title: test.title,
        description: test.description,
        isPublished: test.isPublished,
        updatedAt: test.updatedAt,
        questionCount: test.questions.length,
        totalPoints: test.questions.reduce((sum, q) => sum + q.points, 0),
        attemptCount: scores.length,
        averageScore: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
      };
    })
  );
};

// GET /api/teacher/tests/:id
exports.getTest = async (req, res) => {
  const test = await findOwnTest(req, { attributes: ['id'] });
  res.json(await loadTeacherTest(test.id));
};

// POST /api/teacher/tests
exports.createTest = async (req, res) => {
  const { questions, ...fields } = validateTestPayload(req.body);

  const testId = await sequelize.transaction(async (transaction) => {
    const test = await Test.create({ ...fields, teacherId: req.user.id }, { transaction });
    await TestQuestion.bulkCreate(
      questions.map((q) => ({ ...q, testId: test.id })),
      { transaction }
    );
    return test.id;
  });

  res.status(201).json(await loadTeacherTest(testId));
};

// PUT /api/teacher/tests/:id — replaces the details and the full question list.
// Existing attempts keep their own snapshot, so past scores are not changed.
exports.updateTest = async (req, res) => {
  const test = await findOwnTest(req);
  const { questions, ...fields } = validateTestPayload(req.body);

  await sequelize.transaction(async (transaction) => {
    await test.update(fields, { transaction });
    await TestQuestion.destroy({ where: { testId: test.id }, transaction });
    await TestQuestion.bulkCreate(
      questions.map((q) => ({ ...q, testId: test.id })),
      { transaction }
    );
  });

  res.json(await loadTeacherTest(test.id));
};

// PATCH /api/teacher/tests/:id/publish  { isPublished: boolean }
exports.setPublished = async (req, res) => {
  const test = await findOwnTest(req);
  const isPublished = req.body.isPublished === true;

  if (isPublished) {
    const questionCount = await TestQuestion.count({ where: { testId: test.id } });
    if (questionCount === 0) {
      throw new HttpError(400, 'Add at least one question before publishing.');
    }
  }

  await test.update({ isPublished });
  res.json({ id: test.id, isPublished: test.isPublished });
};

// DELETE /api/teacher/tests/:id
exports.deleteTest = async (req, res) => {
  const test = await findOwnTest(req);
  await sequelize.transaction(async (transaction) => {
    await TestAttempt.destroy({ where: { testId: test.id }, transaction });
    await TestQuestion.destroy({ where: { testId: test.id }, transaction });
    await test.destroy({ transaction });
  });
  res.json({ message: 'Test deleted.' });
};

// GET /api/teacher/tests/:id/attempts
exports.listAttempts = async (req, res) => {
  const test = await findOwnTest(req, {
    include: [{ model: TestQuestion, as: 'questions', attributes: ['id', 'points'] }],
  });

  const attempts = await TestAttempt.findAll({
    where: { testId: test.id },
    attributes: { exclude: ['review'] },
    include: [{ model: User, as: 'student', attributes: ['id', 'name', 'email'] }],
    order: [['createdAt', 'DESC']],
  });

  const scores = attempts.map((a) => a.score);

  res.json({
    test: {
      id: test.id,
      title: test.title,
      isPublished: test.isPublished,
      questionCount: test.questions.length,
      totalPoints: test.questions.reduce((sum, q) => sum + q.points, 0),
    },
    summary: {
      attemptCount: attempts.length,
      averageScore: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
      highestScore: scores.length ? Math.max(...scores) : null,
      lowestScore: scores.length ? Math.min(...scores) : null,
    },
    attempts: attempts.map((a) => ({
      id: a.id,
      student: a.student ? { id: a.student.id, name: a.student.name, email: a.student.email } : null,
      score: a.score,
      pointsEarned: a.pointsEarned,
      pointsPossible: a.pointsPossible,
      correctCount: a.correctCount,
      totalQuestions: a.totalQuestions,
      submittedAt: a.createdAt,
    })),
  });
};

// GET /api/teacher/tests/:id/attempts/:attemptId — one student's answers
exports.getAttempt = async (req, res) => {
  const test = await findOwnTest(req, { attributes: ['id', 'title'] });
  const attempt = await TestAttempt.findOne({
    where: { id: parseId(req.params.attemptId, 'attempt id'), testId: test.id },
  });
  if (!attempt) {
    throw new HttpError(404, 'Submission not found.');
  }
  res.json(formatAttempt(attempt, test.title));
};

// DELETE /api/teacher/tests/:id/attempts/:attemptId — lets the student take the test again
exports.resetAttempt = async (req, res) => {
  const test = await findOwnTest(req, { attributes: ['id'] });
  const deleted = await TestAttempt.destroy({
    where: { id: parseId(req.params.attemptId, 'attempt id'), testId: test.id },
  });
  if (deleted === 0) {
    throw new HttpError(404, 'Submission not found.');
  }
  res.json({ message: 'Submission removed. The student can now retake the test.' });
};
