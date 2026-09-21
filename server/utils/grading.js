const { HttpError } = require('./http');

// Answers are compared ignoring case, surrounding spaces and repeated inner spaces.
const normalizeAnswer = (value) =>
  String(value ?? '')
    .normalize('NFC')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();

const isAnswerCorrect = (given, acceptedAnswers) => {
  const normalized = normalizeAnswer(given);
  return normalized !== '' && acceptedAnswers.some((accepted) => normalizeAnswer(accepted) === normalized);
};

// Turns [{ questionId, answer }] into a Map, keeping only the first answer per question
// so a client cannot inflate its score by repeating a correct answer.
const toAnswerMap = (answers) => {
  if (!Array.isArray(answers)) {
    throw new HttpError(400, 'Answers must be sent as an array.');
  }

  const answerMap = new Map();
  for (const item of answers) {
    const questionId = Number(item?.questionId);
    if (Number.isInteger(questionId) && typeof item.answer === 'string' && !answerMap.has(questionId)) {
      answerMap.set(questionId, item.answer.slice(0, 500));
    }
  }
  return answerMap;
};

// Grades a test attempt and returns a self-contained review, so results stay
// readable even if the teacher edits the test later.
const gradeTest = (questions, answerMap) => {
  let pointsEarned = 0;
  let pointsPossible = 0;
  let correctCount = 0;

  const review = questions.map((question) => {
    const yourAnswer = answerMap.get(question.id) ?? '';
    const isCorrect = isAnswerCorrect(yourAnswer, question.correctAnswers);

    pointsPossible += question.points;
    if (isCorrect) {
      pointsEarned += question.points;
      correctCount += 1;
    }

    return {
      questionId: question.id,
      questionText: question.questionText,
      type: question.type,
      options: question.options,
      points: question.points,
      yourAnswer,
      correctAnswer: question.correctAnswers[0],
      acceptedAnswers: question.correctAnswers,
      isCorrect,
    };
  });

  return {
    score: pointsPossible > 0 ? Math.round((pointsEarned / pointsPossible) * 100) : 0,
    pointsEarned,
    pointsPossible,
    correctCount,
    totalQuestions: questions.length,
    review,
  };
};

module.exports = { normalizeAnswer, isAnswerCorrect, toAnswerMap, gradeTest };
