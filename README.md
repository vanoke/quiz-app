# Quiz App

Веб-приложение для проведения квизов в реальном времени.

## Стек

- **Frontend:** React + Vite
- **Backend:** Node.js + Express
- **Realtime:** Socket.IO
- **БД:** SQLite + Prisma
- **Auth:** JWT + bcrypt

## Структура

- `client/` — фронтенд
- `server/` — бэкенд

## Запуск

### Сервер

\`\`\`bash
cd server
npm install
npx prisma migrate dev
npm run dev
\`\`\`

### Клиент

\`\`\`bash
cd client
npm install
npm run dev
\`\`\`

## Функциональность

- Регистрация и авторизация (участники и организаторы)
- Создание и настройка квизов
- Вопросы с текстом и изображениями, одиночный и множественный выбор
- Подключение к квизу по коду комнаты
- Реальное время через WebSocket
- Подсчёт баллов и лидерборд
- Личный кабинет с историей