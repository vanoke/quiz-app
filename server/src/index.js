import './lib/env.js';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';

import authRoutes from './routes/auth.js';


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

io.on('connection', (socket) => {
  console.log('Подключён клиент:', socket.id);
  socket.on('disconnect', () => {
    console.log('Отключён клиент:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});