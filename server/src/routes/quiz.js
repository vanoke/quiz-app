import { Router } from 'express';
import {
  listMyQuizzes,
  getQuiz,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  uploadImage,
} from '../controllers/quizController.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

// Все роуты требуют авторизации
router.use(authMiddleware);

// Только для организаторов — создание/редактирование/удаление
router.get('/my', requireRole('host'), listMyQuizzes);
router.post('/', requireRole('host'), createQuiz);
router.put('/:id', requireRole('host'), updateQuiz);
router.delete('/:id', requireRole('host'), deleteQuiz);

// Просмотр доступен всем авторизованным
router.get('/:id', getQuiz);

// Загрузка картинки — для организаторов
router.post('/upload', requireRole('host'), upload.single('image'), uploadImage);

export default router;