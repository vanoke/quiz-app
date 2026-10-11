import prisma from '../lib/prisma.js';

// Список квизов текущего организатора
export async function listMyQuizzes(req, res) {
  try {
    const quizzes = await prisma.quiz.findMany({
      where: { hostId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { questions: true } },
      },
    });
    res.json({ quizzes });
  } catch (err) {
    console.error('listMyQuizzes:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

// Получить квиз со всеми вопросами и ответами
export async function getQuiz(req, res) {
  try {
    const quiz = await prisma.quiz.findUnique({
      where: { id: req.params.id },
      include: {
        questions: {
          orderBy: { order: 'asc' },
          include: {
            answers: { orderBy: { order: 'asc' } },
          },
        },
      },
    });

    if (!quiz) {
      return res.status(404).json({ error: 'Квиз не найден' });
    }

    res.json({ quiz });
  } catch (err) {
    console.error('getQuiz:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

// Создать новый квиз
export async function createQuiz(req, res) {
  try {
    const { title, description, category, timePerQuestion } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Название обязательно' });
    }

    const quiz = await prisma.quiz.create({
      data: {
        title: title.trim(),
        description: description || '',
        category: category || 'Общее',
        timePerQuestion: Number(timePerQuestion) || 30,
        hostId: req.user.id,
      },
    });

    res.status(201).json({ quiz });
  } catch (err) {
    console.error('createQuiz:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

// Обновить квиз
export async function updateQuiz(req, res) {
  try {
    const { id } = req.params;

    const existing = await prisma.quiz.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Квиз не найден' });
    }

    if (existing.hostId !== req.user.id) {
      return res.status(403).json({ error: 'Нет доступа к этому квизу' });
    }

    const { title, description, category, timePerQuestion, status } = req.body;

    const quiz = await prisma.quiz.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description }),
        ...(category !== undefined && { category }),
        ...(timePerQuestion !== undefined && { timePerQuestion: Number(timePerQuestion) }),
        ...(status !== undefined && { status }),
      },
    });

    res.json({ quiz });
  } catch (err) {
    console.error('updateQuiz:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

// Удалить квиз
export async function deleteQuiz(req, res) {
  try {
    const { id } = req.params;

    const existing = await prisma.quiz.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Квиз не найден' });
    }

    if (existing.hostId !== req.user.id) {
      return res.status(403).json({ error: 'Нет доступа к этому квизу' });
    }

    await prisma.quiz.delete({ where: { id } });

    res.json({ success: true });
  } catch (err) {
    console.error('deleteQuiz:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

// Загрузка картинки (для обложки или вопросов)
export async function uploadImage(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'Файл не загружен' });
  }

  const url = `/uploads/${req.file.filename}`;
  res.json({ url });
}