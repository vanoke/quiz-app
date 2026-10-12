# Quiz App

Веб-приложение для проведения квизов в реальном времени.

**Стек:** React + Vite, Node.js + Express, Socket.IO, SQLite + Prisma, JWT.

**Макеты:** [Figma](https://www.figma.com/design/aNsrPGWl4jJqyUh9Sp7wqd/PracticeProject?node-id=0-1&t=9LIUdyw6YqiCBF3y-1)

**Репозиторий:** https://github.com/vanoke/quiz-app

## Запуск

### Сервер
```bash
cd server
npm install
npx prisma migrate dev
node src/index.js