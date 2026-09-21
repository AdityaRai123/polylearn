const { Language, Unit, Lesson } = require('../models');
const { HttpError, parseId } = require('../utils/http');

// GET /api/languages
exports.getLanguages = async (req, res) => {
  const languages = await Language.findAll({ order: [['id', 'ASC']] });
  res.json(languages);
};

// GET /api/languages/:id
exports.getLanguageById = async (req, res) => {
  const language = await Language.findByPk(parseId(req.params.id), {
    include: [
      {
        model: Unit,
        as: 'units',
        include: [{ model: Lesson, as: 'lessons' }],
      },
    ],
    // Nested includes must be ordered from the top-level query
    order: [
      [{ model: Unit, as: 'units' }, 'orderIndex', 'ASC'],
      [{ model: Unit, as: 'units' }, { model: Lesson, as: 'lessons' }, 'orderIndex', 'ASC'],
    ],
  });

  if (!language) {
    throw new HttpError(404, 'Language not found.');
  }

  res.json(language);
};

// GET /api/units/:id/lessons
exports.getLessonsByUnit = async (req, res) => {
  const lessons = await Lesson.findAll({
    where: { unitId: parseId(req.params.id) },
    order: [['orderIndex', 'ASC']],
  });
  res.json(lessons);
};
