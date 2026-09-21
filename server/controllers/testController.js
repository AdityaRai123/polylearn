const { Test, TestQuestion, TestAttempt, User } = require('../models');
const { HttpError, parseId } = require('../utils/http');
const { toAnswerMap, gradeTest } = require('../utils/grading');

const questionsInclude = (attributes) => ({
  model: TestQuestion,
  as: 'questions',
  attributes,
});
const questionsOrder = [[{ model: TestQuestion, as: 'questions' }, 'orderIndex', 'ASC']];

const formatAttempt = (attempt, testTitle) => ({
  attemptId: attempt.id,
  testId: attempt.testId,
  testTitle,
  score: attempt.score,
  pointsEarned: attempt.pointsEarned,
  pointsPossible: attempt.pointsPossible,
  correctCount: attempt.correctCount,
  totalQuestions: attempt.totalQuestions,
  submittedAt: attempt.createdAt,
  review: attempt.review,
});

exports.formatAttempt = formatAttempt;

// GET /api/tests — published tests, with the student's own result if already taken
exports.listTests = async (req, res) => {
  const [tests, attempts] = await Promise.all([
    Test.findAll({
      where: { isPublished: true },
      include: [{ model: User, as: 'teacher', attributes: ['name'] }, questionsInclude(['id', 'points'])],
      order: [['createdAt', 'DESC']],
    }),
    TestAttempt.findAll({
      where: { userId: req.user.id },
      attributes: ['id', 'testId', 'score', 'createdAt'],
    }),
  ]);

  const attemptByTest = new Map(attempts.map((attempt) => [attempt.testId, attempt]));

  res.json(
    tests.map((test) => {
      const attempt = attemptByTest.get(test.id);
      return {
        id: test.id,
        title: test.title,
        description: test.description,
        teacherName: test.teacher?.name || 'Teacher',
        questionCount: test.questions.length,
        totalPoints: test.questions.reduce((sum, q) => sum + q.points, 0),
        publishedAt: test.createdAt,
        attempt: attempt ? { id: attempt.id, score: attempt.score, submittedAt: attempt.createdAt } : null,
      };
    })
  );
};

// GET /api/tests/:id — questions for taking the test (never includes the answers)
exports.getTest = async (req, res) => {
  const testId = parseId(req.params.id);

  const test = await Test.findOne({
    where: { id: testId, isPublished: true },
    include: [
      { model: User, as: 'teacher', attributes: ['name'] },
      questionsInclude(['id', 'type', 'questionText', 'options', 'points']),
    ],
    order: questionsOrder,
  });
  if (!test) {
    throw new HttpError(404, 'This test is not available.');
  }

  const attempt = await TestAttempt.findOne({ where: { testId, userId: req.user.id }, attributes: ['id'] });

  res.json({
    id: test.id,
    title: test.title,
    description: test.description,
    teacherName: test.teacher?.name || 'Teacher',
    questions: test.questions,
    totalPoints: test.questions.reduce((sum, q) => sum + q.points, 0),
    attemptId: attempt ? attempt.id : null,
  });
};

// POST /api/tests/:id/submit — grade on the server and return the score immediately
exports.submitTest = async (req, res) => {
  const testId = parseId(req.params.id);
  const userId = req.user.id;
  const answerMap = toAnswerMap(req.body.answers);

  const test = await Test.findOne({
    where: { id: testId, isPublished: true },
    include: [questionsInclude()],
    order: questionsOrder,
  });
  if (!test) {
    throw new HttpError(404, 'This test is not available.');
  }
  if (test.questions.length === 0) {
    throw new HttpError(400, 'This test has no questions yet.');
  }

  const existing = await TestAttempt.findOne({ where: { testId, userId }, attributes: ['id'] });
  if (existing) {
    throw new HttpError(409, 'You have already submitted this test.');
  }

  const { review, ...summary } = gradeTest(test.questions, answerMap);

  let attempt;
  try {
    attempt = await TestAttempt.create({ testId, userId, ...summary, review });
  } catch (err) {
    // Two submissions racing each other: the unique index lets only one through
    if (err.name === 'SequelizeUniqueConstraintError') {
      throw new HttpError(409, 'You have already submitted this test.');
    }
    throw err;
  }

  res.status(201).json(formatAttempt(attempt, test.title));
};

// GET /api/tests/:id/result — the student's own graded attempt
exports.getMyResult = async (req, res) => {
  const attempt = await TestAttempt.findOne({
    where: { testId: parseId(req.params.id), userId: req.user.id },
    include: [{ model: Test, as: 'test', attributes: ['title'] }],
  });
  if (!attempt) {
    throw new HttpError(404, "You haven't taken this test yet.");
  }

  res.json(formatAttempt(attempt, attempt.test?.title));
};
