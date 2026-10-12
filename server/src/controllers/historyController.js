import prisma from '../lib/prisma.js';

// История проведённых игр организатора
export async function hostedHistory(req, res) {
  try {
    const rooms = await prisma.room.findMany({
      where: {
        hostId: req.user.id,
        status: 'finished',
      },
      orderBy: { finishedAt: 'desc' },
      include: {
        quiz: { select: { id: true, title: true, category: true } },
        players: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: [{ score: 'desc' }, { joinedAt: 'asc' }],
        },
      },
    });

    const result = rooms.map((room) => {
      const winner = room.players[0] || null;
      return {
        roomId: room.id,
        code: room.code,
        quiz: room.quiz,
        startedAt: room.startedAt,
        finishedAt: room.finishedAt,
        playersCount: room.players.length,
        winner: winner
          ? { name: winner.user.name, score: winner.score }
          : null,
      };
    });

    res.json({ history: result });
  } catch (err) {
    console.error('hostedHistory:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

// История участий игрока
export async function playedHistory(req, res) {
  try {
    const participations = await prisma.roomPlayer.findMany({
      where: {
        userId: req.user.id,
        room: { status: 'finished' },
      },
      orderBy: { joinedAt: 'desc' },
      include: {
        room: {
          include: {
            quiz: { select: { id: true, title: true, category: true } },
            host: { select: { id: true, name: true } },
            players: { select: { id: true, score: true } },
          },
        },
      },
    });

    const result = participations.map((p) => {
      const sortedPlayers = [...p.room.players].sort((a, b) => b.score - a.score);
      const myPlace = sortedPlayers.findIndex((rp) => rp.id === p.id) + 1;

      return {
        roomId: p.room.id,
        quiz: p.room.quiz,
        host: p.room.host,
        playedAt: p.room.finishedAt || p.room.startedAt,
        score: p.score,
        place: myPlace,
        totalPlayers: p.room.players.length,
      };
    });

    res.json({ history: result });
  } catch (err) {
    console.error('playedHistory:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}