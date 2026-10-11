import prisma from '../lib/prisma.js';

// ─────── КВИЗЫ ───────

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

export async function uploadImage(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'Файл не загружен' });
  }

  const url = `/uploads/${req.file.filename}`;
  res.json({ url });
}

// ─────── ВОПРОСЫ ───────

export async function createQuestion(req, res) {
  try {
    const { quizId } = req.params;
    const { text, imageUrl, type, timeLimit, answers } = req.body;

    const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
    if (!quiz) {
      return res.status(404).json({ error: 'Квиз не найден' });
    }
    if (quiz.hostId !== req.user.id) {
      return res.status(403).json({ error: 'Нет доступа к этому квизу' });
    }

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Текст вопроса обязателен' });
    }

    if (!Array.isArray(answers) || answers.length < 2) {
      return res.status(400).json({ error: 'Нужно минимум 2 варианта ответа' });
    }

    const hasCorrect = answers.some((a) => a.isCorrect);
    if (!hasCorrect) {
      return res.status(400).json({ error: 'Отметьте хотя бы один правильный ответ' });
    }

    const lastQuestion = await prisma.question.findFirst({
      where: { quizId },
      orderBy: { order: 'desc' },
    });
    const order = lastQuestion ? lastQuestion.order + 1 : 0;

    const question = await prisma.question.create({
      data: {
        quizId,
        text: text.trim(),
        imageUrl: imageUrl || null,
        type: type === 'multiple' ? 'multiple' : 'single',
        timeLimit: timeLimit ? Number(timeLimit) : null,
        order,
        answers: {
          create: answers.map((a, idx) => ({
            text: a.text.trim(),
            imageUrl: a.imageUrl || null,
            isCorrect: Boolean(a.isCorrect),
            order: idx,
          })),
        },
      },
      include: { answers: { orderBy: { order: 'asc' } } },
    });

    res.status(201).json({ question });
  } catch (err) {
    console.error('createQuestion:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

export async function updateQuestion(req, res) {
  try {
    const { questionId } = req.params;
    const { text, imageUrl, type, timeLimit, answers } = req.body;

    const existing = await prisma.question.findUnique({
      where: { id: questionId },
      include: { quiz: true },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Вопрос не найден' });
    }
    if (existing.quiz.hostId !== req.user.id) {
      return res.status(403).json({ error: 'Нет доступа к этому вопросу' });
    }

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Текст вопроса обязателен' });
    }

    if (!Array.isArray(answers) || answers.length < 2) {
      return res.status(400).json({ error: 'Нужно минимум 2 варианта ответа' });
    }

    const hasCorrect = answers.some((a) => a.isCorrect);
    if (!hasCorrect) {
      return res.status(400).json({ error: 'Отметьте хотя бы один правильный ответ' });
    }

    await prisma.answer.deleteMany({ where: { questionId } });

    const question = await prisma.question.update({
      where: { id: questionId },
      data: {
        text: text.trim(),
        imageUrl: imageUrl || null,
        type: type === 'multiple' ? 'multiple' : 'single',
        timeLimit: timeLimit ? Number(timeLimit) : null,
        answers: {
          create: answers.map((a, idx) => ({
            text: a.text.trim(),
            imageUrl: a.imageUrl || null,
            isCorrect: Boolean(a.isCorrect),
            order: idx,
          })),
        },
      },
      include: { answers: { orderBy: { order: 'asc' } } },
    });

    res.json({ question });
  } catch (err) {
    console.error('updateQuestion:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

export async function deleteQuestion(req, res) {
  try {
    const { questionId } = req.params;

    const existing = await prisma.question.findUnique({
      where: { id: questionId },
      include: { quiz: true },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Вопрос не найден' });
    }
    if (existing.quiz.hostId !== req.user.id) {
      return res.status(403).json({ error: 'Нет доступа' });
    }

    await prisma.question.delete({ where: { id: questionId } });
    res.json({ success: true });
  } catch (err) {
    console.error('deleteQuestion:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}