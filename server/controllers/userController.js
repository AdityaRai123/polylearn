const { User, UserStats, UserProgress, Language, Unit, Lesson, Question, sequelize } = require('../models');
const { Op } = require('sequelize');

// POST /api/lessons/:id/submit (Protected)
exports.submitLesson = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const lessonId = req.params.id;
    const userId = req.user.id;
    const { answers } = req.body; // Expecting { answers: [ { questionId, answer }, ... ] }

    if (!answers || !Array.isArray(answers)) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Answers array is required.' });
    }

    // Fetch the lesson and its questions
    const lesson = await Lesson.findByPk(lessonId, {
      include: [{ model: Question, as: 'questions' }],
      transaction
    });

    if (!lesson) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Lesson not found.' });
    }

    const questions = lesson.questions;
    if (questions.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ message: 'This lesson has no questions.' });
    }

    // Evaluate answers
    let correctCount = 0;
    let wrongCount = 0;

    answers.forEach(submitted => {
      const q = questions.find(question => question.id === submitted.questionId);
      if (q) {
        // Simple case-insensitive match for MVP
        const isCorrect = q.correctAnswer.trim().toLowerCase() === submitted.answer.trim().toLowerCase();
        if (isCorrect) {
          correctCount++;
        } else {
          wrongCount++;
        }
      }
    });

    const totalQuestions = questions.length;
    const score = Math.round((correctCount / totalQuestions) * 100);

    // Fetch user stats
    const stats = await UserStats.findOne({ where: { userId }, transaction });
    if (!stats) {
      await transaction.rollback();
      return res.status(404).json({ message: 'User stats not found.' });
    }

    // Hearts gamification: lose 1 heart per wrong answer, minimum 0
    let initialHearts = stats.hearts;
    let updatedHearts = Math.max(0, initialHearts - wrongCount);

    // Complete status: fail if hearts hit 0 and we didn't get all correct, or just let them finish but score is registered
    const lessonFailed = updatedHearts === 0 && correctCount < totalQuestions;

    // XP calculation: 10 XP for completion + 2 XP for each correct answer
    // If failed, they get 0 XP completion bonus, but maybe 1 XP per correct answer
    let xpGained = 0;
    if (!lessonFailed) {
      xpGained = 10 + (correctCount * 2);
    } else {
      xpGained = correctCount * 1; // minor consolatory XP
    }

    // Streak calculation
    const todayStr = new Date().toISOString().split('T')[0];
    let updatedStreak = stats.streakCount;

    if (stats.lastActiveDate) {
      const lastActive = new Date(stats.lastActiveDate);
      const today = new Date(todayStr);
      const diffTime = today - lastActive;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // Active yesterday, increment streak
        updatedStreak += 1;
      } else if (diffDays > 1) {
        // Gap of more than 1 day, reset streak to 1
        updatedStreak = 1;
      }
      // If diffDays === 0, active today already, streak remains unchanged
    } else {
      // First active day, set streak to 1
      updatedStreak = 1;
    }

    // Update stats database record
    stats.xp += xpGained;
    stats.hearts = updatedHearts;
    stats.streakCount = updatedStreak;
    stats.lastActiveDate = todayStr;
    await stats.save({ transaction });

    // Save lesson completion in user progress (only if not failed)
    if (!lessonFailed) {
      await UserProgress.create({
        userId,
        lessonId,
        score
      }, { transaction });
    }

    await transaction.commit();

    res.status(200).json({
      success: !lessonFailed,
      score,
      correctCount,
      totalQuestions,
      xpGained,
      heartsLeft: updatedHearts,
      streakCount: updatedStreak,
      heartsLost: wrongCount
    });

  } catch (err) {
    if (transaction) await transaction.rollback();
    console.error('submitLesson error:', err);
    res.status(500).json({ message: 'Error submitting lesson answers.' });
  }
};

// GET /api/user/dashboard (Protected)
exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Fetch user statistics and refill hearts if it is a new day
    const stats = await UserStats.findOne({ where: { userId } });
    if (!stats) {
      return res.status(404).json({ message: 'User stats not found.' });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    // Check if the user hasn't active today and their hearts are less than 5. Refill hearts daily!
    if (stats.lastActiveDate !== todayStr && stats.hearts < 5) {
      stats.hearts = 5;
      await stats.save();
    }

    // 2. Fetch course progress
    // Get all languages, units, lessons
    const languages = await Language.findAll({
      include: [
        {
          model: Unit,
          as: 'units',
          include: [{ model: Lesson, as: 'lessons' }]
        }
      ]
    });

    // Get completed lessons for this user
    const completedProgress = await UserProgress.findAll({
      where: { userId },
      attributes: ['lessonId', 'score']
    });

    // Extract unique completed lesson IDs (score >= 70 or just completed)
    const completedLessonIds = new Set(completedProgress.map(p => p.lessonId));

    const courseProgress = languages.map(lang => {
      let totalLessons = 0;
      let completedLessons = 0;

      lang.units.forEach(unit => {
        unit.lessons.forEach(lesson => {
          totalLessons++;
          if (completedLessonIds.has(lesson.id)) {
            completedLessons++;
          }
        });
      });

      const percentComplete = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

      return {
        languageId: lang.id,
        languageName: lang.name,
        languageCode: lang.code,
        totalLessons,
        completedLessons,
        percentComplete
      };
    });

    // 3. Fetch leaderboard (Top 10 users by XP)
    const leaderboard = await UserStats.findAll({
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }],
      order: [['xp', 'DESC']],
      limit: 10
    });

    const formattedLeaderboard = leaderboard.map((item, index) => ({
      rank: index + 1,
      userId: item.user.id,
      name: item.user.name,
      xp: item.xp,
      streak: item.streakCount
    }));

    res.status(200).json({
      stats: {
        xp: stats.xp,
        streakCount: stats.streakCount,
        hearts: stats.hearts,
        lastActiveDate: stats.lastActiveDate
      },
      completedLessonIds: Array.from(completedLessonIds),
      courseProgress,
      leaderboard: formattedLeaderboard
    });

  } catch (err) {
    console.error('getDashboard error:', err);
    res.status(500).json({ message: 'Error loading dashboard statistics.' });
  }
};

// POST /api/user/refill-hearts (Protected)
exports.refillHearts = async (req, res) => {
  try {
    const userId = req.user.id;
    const stats = await UserStats.findOne({ where: { userId } });

    if (!stats) {
      return res.status(404).json({ message: 'User stats not found.' });
    }

    if (stats.hearts >= 5) {
      return res.status(400).json({ message: 'Your hearts are already full!' });
    }

    // Refill logic: Costs 50 XP
    if (stats.xp >= 50) {
      stats.xp -= 50;
      stats.hearts = 5;
      await stats.save();
      return res.status(200).json({
        message: 'Hearts successfully refilled for 50 XP!',
        hearts: stats.hearts,
        xp: stats.xp
      });
    } else {
      // In case they don't have enough XP, allow them to refill for free for demonstration convenience but alert them
      stats.hearts = 5;
      await stats.save();
      return res.status(200).json({
        message: 'Hearts refilled! (Free refill for MVP demonstration, since XP < 50)',
        hearts: stats.hearts,
        xp: stats.xp
      });
    }

  } catch (err) {
    console.error('refillHearts error:', err);
    res.status(500).json({ message: 'Error refilling hearts.' });
  }
};

// DELETE /api/user (Protected)
exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    // Deleting User record will automatically trigger onDelete: CASCADE for UserStats and UserProgress!
    const deletedCount = await User.destroy({ where: { id: userId } });

    if (deletedCount === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.status(200).json({ message: 'Account successfully deleted.' });
  } catch (err) {
    console.error('deleteAccount error:', err);
    res.status(500).json({ message: 'Error deleting account.' });
  }
};
