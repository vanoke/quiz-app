import prisma from '../lib/prisma.js';
import { verifyToken } from '../lib/jwt.js';

// Кеш активных игр в памяти: roomId -> { questionIndex, questionStartedAt, showingResults, timer }
const activeGames = new Map();

// Генератор 6-символьного кода комнаты (без похожих символов O/0, I/1)
function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// Подсчёт очков: 500 базовых + до 500 за скорость
function calculatePoints(isCorrect, timeSpentSec, timeLimitSec) {
  if (!isCorrect) return 0;
  const base = 500;
  const ratio = Math.max(0, Math.min(1, 1 - timeSpentSec / timeLimitSec));
  const speedBonus = Math.round(500 * ratio);
  return base + speedBonus;
}

// Загрузить комнату со всем нужным
async function getRoomWithQuiz(roomId) {
  return prisma.room.findUnique({
    where: { id: roomId },
    include: {
      quiz: {
        include: {
          questions: {
            orderBy: { order: 'asc' },
            include: { answers: { orderBy: { order: 'asc' } } },
          },
        },
      },
      players: {
        include: { user: { select: { id: true, name: true } } },
      },
    },
  });
}

export function setupGameSocket(io) {
  // ─── Middleware: проверка JWT при подключении ───
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Токен не предоставлен'));

    const decoded = verifyToken(token);
    if (!decoded) return next(new Error('Неверный или истёкший токен'));

    socket.user = decoded;
    next();
  });

  io.on('connection', (socket) => {
    console.log('Socket подключён:', socket.id, '| user:', socket.user.email);

    // ─────────── ОРГАНИЗАТОР: создать комнату ───────────
    socket.on('room:create', async ({ quizId }, callback) => {
      try {
        if (socket.user.role !== 'host') {
          return callback?.({ error: 'Только организатор может создать комнату' });
        }

        const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
        if (!quiz) return callback?.({ error: 'Квиз не найден' });
        if (quiz.hostId !== socket.user.id) return callback?.({ error: 'Нет доступа к этому квизу' });
        if (quiz.status !== 'published') return callback?.({ error: 'Квиз должен быть опубликован' });

        // Генерируем уникальный код
        let code;
        let attempts = 0;
        while (attempts < 10) {
          code = generateRoomCode();
          const exists = await prisma.room.findUnique({ where: { code } });
          if (!exists) break;
          attempts++;
        }

        const room = await prisma.room.create({
          data: {
            code,
            quizId,
            hostId: socket.user.id,
            status: 'waiting',
          },
          include: { quiz: true },
        });

        socket.join(`room:${room.id}`);
        socket.roomId = room.id;

        callback?.({ room });
        io.to(`room:${room.id}`).emit('room:update', { room });
      } catch (err) {
        console.error('room:create:', err);
        callback?.({ error: 'Ошибка сервера' });
      }
    });

    // ─────────── УЧАСТНИК: подключиться к комнате ───────────
    socket.on('room:join', async ({ code }, callback) => {
      try {
        if (!code || typeof code !== 'string') {
          return callback?.({ error: 'Введите код комнаты' });
        }

        const room = await prisma.room.findUnique({
          where: { code: code.toUpperCase().trim() },
          include: { quiz: true },
        });

        if (!room) return callback?.({ error: 'Комната не найдена' });
        if (room.status === 'finished') return callback?.({ error: 'Игра уже завершена' });

        // Организатор зашёл в свою комнату
        if (room.hostId === socket.user.id) {
          socket.join(`room:${room.id}`);
          socket.roomId = room.id;

          const players = await prisma.roomPlayer.findMany({
            where: { roomId: room.id },
            include: { user: { select: { id: true, name: true } } },
            orderBy: { joinedAt: 'asc' },
          });

          return callback?.({ room, players, isHost: true });
        }

        // Проверяем, не в комнате ли уже
        let player = await prisma.roomPlayer.findUnique({
          where: { roomId_userId: { roomId: room.id, userId: socket.user.id } },
        });

        if (!player) {
          if (room.status !== 'waiting') {
            return callback?.({ error: 'Игра уже началась, подключиться нельзя' });
          }

          player = await prisma.roomPlayer.create({
            data: {
              roomId: room.id,
              userId: socket.user.id,
            },
          });
        }

        socket.join(`room:${room.id}`);
        socket.roomId = room.id;
        socket.playerId = player.id;

        const players = await prisma.roomPlayer.findMany({
          where: { roomId: room.id },
          include: { user: { select: { id: true, name: true } } },
          orderBy: { joinedAt: 'asc' },
        });

        callback?.({ room, players, playerId: player.id });
        io.to(`room:${room.id}`).emit('room:players', { players });
      } catch (err) {
        console.error('room:join:', err);
        callback?.({ error: 'Ошибка сервера' });
      }
    });

    // ─────────── ОРГАНИЗАТОР: старт игры ───────────
    socket.on('room:start', async ({ roomId }, callback) => {
      try {
        const room = await getRoomWithQuiz(roomId);
        if (!room) return callback?.({ error: 'Комната не найдена' });
        if (room.hostId !== socket.user.id) return callback?.({ error: 'Нет доступа' });
        if (room.status !== 'waiting') return callback?.({ error: 'Игра уже началась' });
        if (room.quiz.questions.length === 0) {
          return callback?.({ error: 'В квизе нет вопросов. Добавьте их перед запуском' });
        }

        await prisma.room.update({
          where: { id: roomId },
          data: {
            status: 'playing',
            startedAt: new Date(),
            currentQuestionIndex: 0,
          },
        });

        io.to(`room:${roomId}`).emit('game:started', {
          roomId,
          quiz: { id: room.quiz.id, title: room.quiz.title },
          totalQuestions: room.quiz.questions.length,
        });

        callback?.({ ok: true });

        // Через 3 секунды показываем первый вопрос
        setTimeout(() => {
          showQuestion(io, roomId, 0).catch((e) => console.error('showQuestion (start):', e));
        }, 3000);
      } catch (err) {
        console.error('room:start:', err);
        callback?.({ error: 'Ошибка сервера' });
      }
    });

    // ─────────── ОРГАНИЗАТОР: следующий вопрос ───────────
    socket.on('room:next', async ({ roomId }, callback) => {
      try {
        const room = await getRoomWithQuiz(roomId);
        if (!room) return callback?.({ error: 'Комната не найдена' });
        if (room.hostId !== socket.user.id) return callback?.({ error: 'Нет доступа' });
        if (room.status !== 'playing') return callback?.({ error: 'Игра не идёт' });

        const nextIndex = room.currentQuestionIndex + 1;

        // Больше вопросов нет → финал
        if (nextIndex >= room.quiz.questions.length) {
          // Очищаем кеш
          const state = activeGames.get(roomId);
          if (state?.timer) clearTimeout(state.timer);
          activeGames.delete(roomId);

          await prisma.room.update({
            where: { id: roomId },
            data: { status: 'finished', finishedAt: new Date() },
          });

          const finalPlayers = await prisma.roomPlayer.findMany({
            where: { roomId },
            include: { user: { select: { id: true, name: true } } },
            orderBy: [{ score: 'desc' }, { joinedAt: 'asc' }],
          });

          io.to(`room:${roomId}`).emit('game:finished', {
            players: finalPlayers,
            quizTitle: room.quiz.title,
          });

          return callback?.({ ok: true, finished: true });
        }

        await prisma.room.update({
          where: { id: roomId },
          data: { currentQuestionIndex: nextIndex },
        });

        callback?.({ ok: true });
        await showQuestion(io, roomId, nextIndex);
      } catch (err) {
        console.error('room:next:', err);
        callback?.({ error: 'Ошибка сервера' });
      }
    });

    // ─────────── УЧАСТНИК: ответ на вопрос ───────────
    socket.on('room:answer', async ({ roomId, questionId, answerIds }, callback) => {
      try {
        const room = await getRoomWithQuiz(roomId);
        if (!room) return callback?.({ error: 'Комната не найдена' });
        if (room.status !== 'playing') return callback?.({ error: 'Игра не идёт' });

        if (!Array.isArray(answerIds) || answerIds.length === 0) {
          return callback?.({ error: 'Выберите хотя бы один вариант' });
        }

        // Проверяем, что это текущий вопрос
        const currentQuestion = room.quiz.questions[room.currentQuestionIndex];
        if (!currentQuestion || currentQuestion.id !== questionId) {
          return callback?.({ error: 'Это не текущий вопрос' });
        }

        // Проверяем состояние игры (таймер)
        const gameState = activeGames.get(roomId);
        if (!gameState || gameState.showingResults) {
          return callback?.({ error: 'Время на ответ истекло' });
        }

        // Игрок
        const player = await prisma.roomPlayer.findUnique({
          where: { roomId_userId: { roomId, userId: socket.user.id } },
        });
        if (!player) return callback?.({ error: 'Вы не подключены к комнате' });

        // Уже отвечал?
        const existing = await prisma.roomAnswer.findUnique({
          where: { playerId_questionId: { playerId: player.id, questionId } },
        });
        if (existing) return callback?.({ error: 'Вы уже ответили на этот вопрос' });

        // Правильные ответы
        const correctAnswerIds = currentQuestion.answers
          .filter((a) => a.isCorrect)
          .map((a) => a.id)
          .sort();
        const selectedIds = [...answerIds].sort();

        const isCorrect =
          correctAnswerIds.length === selectedIds.length &&
          correctAnswerIds.every((id, i) => id === selectedIds[i]);

        // Считаем очки
        const timeLimitSec = currentQuestion.timeLimit || room.quiz.timePerQuestion;
        const timeSpentSec = (Date.now() - gameState.questionStartedAt) / 1000;
        const points = calculatePoints(isCorrect, timeSpentSec, timeLimitSec);

        // Сохраняем ответ
        await prisma.roomAnswer.create({
          data: {
            roomId,
            playerId: player.id,
            questionId,
            answerIds: JSON.stringify(answerIds),
            isCorrect,
            points,
          },
        });

        // Обновляем счёт игрока
        await prisma.roomPlayer.update({
          where: { id: player.id },
          data: { score: { increment: points } },
        });

        callback?.({ ok: true, isCorrect, points });

        // Обновляем лидерборд у всех (без правильных ответов!)
        const players = await prisma.roomPlayer.findMany({
          where: { roomId },
          include: { user: { select: { id: true, name: true } } },
          orderBy: [{ score: 'desc' }, { joinedAt: 'asc' }],
        });
        io.to(`room:${roomId}`).emit('room:players', { players });
      } catch (err) {
        console.error('room:answer:', err);
        callback?.({ error: 'Ошибка сервера' });
      }
    });

    // ─────────── Отключение ───────────
    socket.on('disconnect', () => {
      console.log('Socket отключён:', socket.id);
    });
  });
}

// ─────────── Показать вопрос всем в комнате ───────────
async function showQuestion(io, roomId, questionIndex) {
  try {
    const room = await getRoomWithQuiz(roomId);
    if (!room) return;

    const question = room.quiz.questions[questionIndex];
    if (!question) return;

    const timeLimitSec = question.timeLimit || room.quiz.timePerQuestion;

    // Очищаем предыдущий таймер, если был
    const prev = activeGames.get(roomId);
    if (prev?.timer) clearTimeout(prev.timer);

    // Новое состояние
    activeGames.set(roomId, {
      questionIndex,
      questionStartedAt: Date.now(),
      showingResults: false,
      timer: null,
    });

    // Отправляем вопрос БЕЗ правильных ответов
    const safeQuestion = {
      id: question.id,
      text: question.text,
      imageUrl: question.imageUrl,
      type: question.type,
      order: question.order,
      answers: question.answers.map((a) => ({
        id: a.id,
        text: a.text,
        imageUrl: a.imageUrl,
      })),
    };

    io.to(`room:${roomId}`).emit('question:show', {
      question: safeQuestion,
      index: questionIndex,
      total: room.quiz.questions.length,
      timeLimit: timeLimitSec,
    });

    // Таймер на завершение вопроса
    const gameState = activeGames.get(roomId);
    gameState.timer = setTimeout(() => {
      showResults(io, roomId, questionIndex).catch((e) =>
        console.error('showResults (timer):', e)
      );
    }, timeLimitSec * 1000);
  } catch (err) {
    console.error('showQuestion:', err);
  }
}

// ─────────── Показать результаты вопроса ───────────
async function showResults(io, roomId, questionIndex) {
  try {
    const gameState = activeGames.get(roomId);
    if (!gameState || gameState.showingResults) return;
    gameState.showingResults = true;

    const room = await getRoomWithQuiz(roomId);
    if (!room) return;

    const question = room.quiz.questions[questionIndex];
    if (!question) return;

    const correctAnswerIds = question.answers
      .filter((a) => a.isCorrect)
      .map((a) => a.id);

    // Статистика по ответам
    const allAnswers = await prisma.roomAnswer.findMany({
      where: { roomId, questionId: question.id },
    });

    const answerCounts = {};
    for (const a of question.answers) answerCounts[a.id] = 0;
    for (const ra of allAnswers) {
      const ids = JSON.parse(ra.answerIds);
      for (const id of ids) {
        if (answerCounts[id] !== undefined) answerCounts[id]++;
      }
    }

    io.to(`room:${roomId}`).emit('question:results', {
      questionId: question.id,
      correctAnswerIds,
      answerCounts,
      totalAnswered: allAnswers.length,
      totalPlayers: room.players.length,
    });

    // Лидерборд
    const players = await prisma.roomPlayer.findMany({
      where: { roomId },
      include: { user: { select: { id: true, name: true } } },
      orderBy: [{ score: 'desc' }, { joinedAt: 'asc' }],
    });
    io.to(`room:${roomId}`).emit('room:players', { players });
  } catch (err) {
    console.error('showResults:', err);
  }
}