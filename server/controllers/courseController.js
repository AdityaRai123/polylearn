const { Language, Unit, Lesson, Question } = require('../models');

// GET /api/languages
exports.getLanguages = async (req, res) => {
  try {
    const languages = await Language.findAll({
      order: [['id', 'ASC']]
    });
    res.status(200).json(languages);
  } catch (err) {
    console.error('getLanguages error:', err);
    res.status(500).json({ message: 'Error retrieving languages.' });
  }
};

// GET /api/languages/:id
exports.getLanguageById = async (req, res) => {
  try {
    const languageId = req.params.id;
    const language = await Language.findByPk(languageId, {
      include: [
        {
          model: Unit,
          as: 'units',
          include: [
            {
              model: Lesson,
              as: 'lessons',
              order: [['orderIndex', 'ASC']]
            }
          ],
          order: [['orderIndex', 'ASC']]
        }
      ]
    });

    if (!language) {
      return res.status(404).json({ message: 'Language not found.' });
    }

    res.status(200).json(language);
  } catch (err) {
    console.error('getLanguageById error:', err);
    res.status(500).json({ message: 'Error retrieving language details.' });
  }
};

// GET /api/units/:id/lessons
exports.getLessonsByUnit = async (req, res) => {
  try {
    const unitId = req.params.id;
    const lessons = await Lesson.findAll({
      where: { unitId },
      order: [['orderIndex', 'ASC']]
    });
    res.status(200).json(lessons);
  } catch (err) {
    console.error('getLessonsByUnit error:', err);
    res.status(500).json({ message: 'Error retrieving lessons.' });
  }
};

// GET /api/lessons/:id (Protected)
exports.getLessonDetails = async (req, res) => {
  try {
    const lessonId = req.params.id;
    const lesson = await Lesson.findByPk(lessonId, {
      include: [
        {
          model: Question,
          as: 'questions'
        }
      ]
    });

    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found.' });
    }

    res.status(200).json(lesson);
  } catch (err) {
    console.error('getLessonDetails error:', err);
    res.status(500).json({ message: 'Error retrieving lesson questions.' });
  }
};
