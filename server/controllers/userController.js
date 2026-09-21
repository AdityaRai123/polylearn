const { User, UserStats, UserProgress, Language, Unit, Lesson } = require('../models');
const { HttpError } = require('../utils/http');

const MAX_HEARTS = 5;
const REFILL_COST_XP = 50;

const findStats = async (userId) => {
  const stats = await UserStats.findOne({ where: { userId } });
  if (!stats) {
    throw new HttpError(404, 'User stats not found.');
  }
  return stats;
};

// GET /api/user/dashboard (Protected, students)
exports.getDashboard = async (req, res) => {
  const userId = req.user.id;
  const stats = await findStats(userId);

  // Hearts refill for free once per day
  const today = new Date().toISOString().split('T')[0];
  if (stats.lastActiveDate !== today && stats.hearts < MAX_HEARTS) {
    stats.hearts = MAX_HEARTS;
    await stats.save();
  }

  const [languages, completedProgress, leaderboard] = await Promise.all([
    Language.findAll({
      include: [{ model: Unit, as: 'units', include: [{ model: Lesson, as: 'lessons', attributes: ['id'] }] }],
      order: [['id', 'ASC']],
    }),
    UserProgress.findAll({ where: { userId }, attributes: ['lessonId'] }),
    UserStats.findAll({
      include: [{ model: User, as: 'user', attributes: ['id', 'name'], where: { role: 'student' } }],
      order: [['xp', 'DESC']],
      limit: 10,
    }),
  ]);

  const completedLessonIds = new Set(completedProgress.map((p) => p.lessonId));

  const courseProgress = languages.map((lang) => {
    const lessonIds = lang.units.flatMap((unit) => unit.lessons.map((lesson) => lesson.id));
    const completedLessons = lessonIds.filter((id) => completedLessonIds.has(id)).length;

    return {
      languageId: lang.id,
      languageName: lang.name,
      languageCode: lang.code,
      totalLessons: lessonIds.length,
      completedLessons,
      percentComplete: lessonIds.length > 0 ? Math.round((completedLessons / lessonIds.length) * 100) : 0,
    };
  });

  res.json({
    stats: {
      xp: stats.xp,
      streakCount: stats.streakCount,
      hearts: stats.hearts,
      lastActiveDate: stats.lastActiveDate,
    },
    completedLessonIds: Array.from(completedLessonIds),
    courseProgress,
    leaderboard: leaderboard.map((item, index) => ({
      rank: index + 1,
      userId: item.user.id,
      name: item.user.name,
      xp: item.xp,
      streak: item.streakCount,
    })),
  });
};

// POST /api/user/refill-hearts (Protected, students)
exports.refillHearts = async (req, res) => {
  const stats = await findStats(req.user.id);

  if (stats.hearts >= MAX_HEARTS) {
    throw new HttpError(400, 'Your hearts are already full!');
  }

  // Costs 50 XP; free when the learner can't afford it (MVP demo convenience)
  const paid = stats.xp >= REFILL_COST_XP;
  if (paid) {
    stats.xp -= REFILL_COST_XP;
  }
  stats.hearts = MAX_HEARTS;
  await stats.save();

  res.json({
    message: paid
      ? `Hearts refilled for ${REFILL_COST_XP} XP!`
      : `Hearts refilled for free (you have less than ${REFILL_COST_XP} XP).`,
    hearts: stats.hearts,
    xp: stats.xp,
  });
};

// DELETE /api/user (Protected)
exports.deleteAccount = async (req, res) => {
  // Cascades to stats, progress, test attempts and (for teachers) their tests
  const deletedCount = await User.destroy({ where: { id: req.user.id } });
  if (deletedCount === 0) {
    throw new HttpError(404, 'User not found.');
  }
  res.json({ message: 'Account successfully deleted.' });
};
