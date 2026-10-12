import './lib/env.js';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';

import authRoutes from './routes/auth.js';
import quizRoutes from './routes/quiz.js';
import historyRoutes from './routes/history.js';
import { setupGameSocket } from './sockets/gameSocket.js';

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  },
});

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Quiz App API работает' });
});

app.use('/api/auth', authRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/history', historyRoutes);

setupGameSocket(io);

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});